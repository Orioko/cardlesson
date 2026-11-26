package api

import (
	"sync"
	"time"
)

// maxLimiterKeys — потолок числа отслеживаемых ключей: тысячи адресов при атаке не съедят память.
const maxLimiterKeys = 50_000

// rateLimiter — «ведро с токенами» на каждый ключ (IP или логин): не даёт перебирать пароли.
type rateLimiter struct {
	mu       sync.Mutex
	buckets  map[string]*bucket
	capacity float64       // сколько попыток можно сделать подряд
	refill   time.Duration // за сколько восстанавливается одна попытка
	now      func() time.Time
}

type bucket struct {
	tokens float64
	last   time.Time
}

func newRateLimiter(capacity int, refill time.Duration) *rateLimiter {
	return &rateLimiter{
		buckets:  map[string]*bucket{},
		capacity: float64(capacity),
		refill:   refill,
		now:      time.Now,
	}
}

// Allow тратит одну попытку для key; false — попытки кончились, надо подождать.
func (l *rateLimiter) Allow(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := l.now()
	b, ok := l.buckets[key]
	if !ok {
		if len(l.buckets) >= maxLimiterKeys {
			l.cleanupLocked()
			if len(l.buckets) >= maxLimiterKeys {
				return false // под массовой атакой новых ключей не заводим — лучше отказать
			}
		}
		b = &bucket{tokens: l.capacity, last: now}
		l.buckets[key] = b
	}
	b.tokens = min(l.capacity, b.tokens+float64(now.Sub(b.last))/float64(l.refill))
	b.last = now
	if b.tokens < 1 {
		return false
	}
	b.tokens--
	return true
}

// Cleanup забывает IP, у которых ведро давно снова полное, чтобы карта не росла бесконечно.
func (l *rateLimiter) Cleanup() {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.cleanupLocked()
}

func (l *rateLimiter) cleanupLocked() {
	full := time.Duration(l.capacity) * l.refill
	for k, b := range l.buckets {
		if l.now().Sub(b.last) > full {
			delete(l.buckets, k)
		}
	}
}
