package dedupe

import "testing"

func TestIndex(t *testing.T) {
	idx := NewIndex([]Values{{Ru: "Кот", En: "cat"}})

	cases := []struct {
		name string
		w    Values
		want bool
	}{
		{"тот же регистр и пробелы", Values{Ru: " кот ", En: "CAT"}, true},
		{"языки поменяны местами", Values{En: "кот", Ko: "cat"}, true},
		{"берётся перевод, если основное поле пустое", Values{TrRu: "кот", En: "cat"}, true},
		{"другое слово", Values{Ru: "кот", En: "dog"}, false},
		{"третий язык делает слово другим", Values{Ru: "кот", En: "cat", Ko: "고양이"}, false},
		{"одно значение дублем не считается", Values{En: "cat"}, false},
	}
	for _, c := range cases {
		if got := idx.Has(c.w); got != c.want {
			t.Errorf("%s: Has = %v, want %v", c.name, got, c.want)
		}
	}
}

func TestKey(t *testing.T) {
	if got := Key(Values{Ru: "Б", En: "а"}); got != "а|б" {
		t.Errorf("Key = %q", got)
	}
	if got := Key(Values{}); got != "" {
		t.Errorf("пустое слово: Key = %q", got)
	}
}
