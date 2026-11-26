package backup

import (
	"context"
	"os"
	"path/filepath"
	"slices"
	"testing"
	"time"

	"cardlesson/internal/store"
)

func TestDailyKeepsOneCopyPerDayAndPrunes(t *testing.T) {
	dir := t.TempDir()
	st, err := store.Open(filepath.Join(dir, "db", "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer st.Close()

	day := time.Date(2026, 1, 1, 12, 0, 0, 0, time.UTC)
	d := &Daily{Store: st, Dir: filepath.Join(dir, "backups"), Keep: 3, Now: func() time.Time { return day }}
	ctx := context.Background()

	for i := 0; i < 5; i++ {
		path, err := d.EnsureToday(ctx)
		if err != nil || path == "" {
			t.Fatalf("день %d: path=%q err=%v", i, path, err)
		}
		// повторный вызов в тот же день новую копию не делает
		if again, err := d.EnsureToday(ctx); err != nil || again != "" {
			t.Fatalf("день %d повторно: path=%q err=%v", i, again, err)
		}
		day = day.AddDate(0, 0, 1)
	}

	entries, err := os.ReadDir(d.Dir)
	if err != nil {
		t.Fatal(err)
	}
	var names []string
	for _, e := range entries {
		names = append(names, e.Name())
	}
	want := []string{"cardlesson-2026-01-03.db", "cardlesson-2026-01-04.db", "cardlesson-2026-01-05.db"}
	if !slices.Equal(names, want) {
		t.Fatalf("копии: %v, ждали %v", names, want)
	}

	// копия — рабочая база
	copyDB, err := store.Open(filepath.Join(d.Dir, want[2]))
	if err != nil {
		t.Fatalf("копия не открывается: %v", err)
	}
	copyDB.Close()
}
