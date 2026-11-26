// Package dedupe — проверка дублей слов (раньше это делал фронтенд, теперь только сервер).
package dedupe

import (
	"slices"
	"strings"
)

// Values — значения слова на трёх языках: основное поле, а если оно пустое — перевод.
type Values struct {
	Ru, En, Ko       string
	TrRu, TrEn, TrKo string
}

func pick(main, translation string) string {
	v := main
	if v == "" {
		v = translation
	}
	return strings.ToLower(strings.TrimSpace(v))
}

// Normalized — непустые значения в нижнем регистре, отсортированные. Порядок языков не важен:
// «кот / cat» и «cat / кот» — одно и то же слово.
func Normalized(w Values) []string {
	out := make([]string, 0, 3)
	for _, v := range []string{pick(w.Ru, w.TrRu), pick(w.En, w.TrEn), pick(w.Ko, w.TrKo)} {
		if v != "" {
			out = append(out, v)
		}
	}
	slices.Sort(out)
	return out
}

// Key — ключ для быстрого сравнения; пустой, если у слова нет ни одного значения.
func Key(w Values) string { return strings.Join(Normalized(w), "|") }

// Equal — оба слова заполнены минимум на двух языках и значения совпадают.
func Equal(a, b []string) bool {
	return len(a) >= 2 && slices.Equal(a, b)
}

// Index — набор уже существующих слов для проверки новых.
type Index struct {
	keys map[string]bool
}

func NewIndex(existing []Values) *Index {
	idx := &Index{keys: make(map[string]bool, len(existing))}
	for _, w := range existing {
		idx.Add(w)
	}
	return idx
}

// Add запоминает слово; слова меньше чем на двух языках дублями не считаются, их не храним.
func (i *Index) Add(w Values) {
	if n := Normalized(w); len(n) >= 2 {
		i.keys[strings.Join(n, "|")] = true
	}
}

// Has — есть ли уже такое слово.
func (i *Index) Has(w Values) bool {
	n := Normalized(w)
	return len(n) >= 2 && i.keys[strings.Join(n, "|")]
}
