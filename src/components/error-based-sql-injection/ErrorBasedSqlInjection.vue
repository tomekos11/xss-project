<template>
  <div class="items-center justify-evenly full-height full-width q-pa-md" style="display: inline-grid">
    <h1 style="font-size: 30px; line-height: normal">Error-Based SQL Injection</h1>

    <q-card bordered flat>
      <q-card-section>
        <p class="text-bold">
          W tym przykładzie zobaczysz, jak błędy SQL mogą ujawnić wewnętrzne szczegóły bazy danych podczas pobierania
          posta po ID.
        </p>

        <q-form @submit.prevent="fetchPost">
          <q-input v-model.trim="postId" label="ID posta (payload SQL)" outlined class="q-my-md"
            style="width: 100%; min-width: min(300px, 100%)" />

          <q-btn color="primary" type="submit" label="Pobierz posta" />
        </q-form>
      </q-card-section>
    </q-card>

    <q-card bordered flat class="q-mt-md" v-if="requestMade">
      <q-card-section>
        <p v-if="post" class="text-positive text-bold">
          ✅ Post został znaleziony!
        </p>
        <p v-else-if="notFound" class="text-negative text-bold">
          ❌ Post nie został znaleziony (zapytanie wykonało się, ale wynik jest pusty — to nie jest błąd SQL).
        </p>
        <p v-else-if="blockedBy" class="text-negative text-bold">
          🛡️ Zablokowano przez: {{ blockedBy }}
        </p>
      </q-card-section>

      <q-card-section v-if="post">
        <p><strong>ID:</strong> {{ post.id }}</p>
        <p><strong>Tytuł:</strong> {{ post.title }}</p>
        <p><strong>Treść:</strong> {{ post.content }}</p>
      </q-card-section>

      <q-card-section v-if="sqlError">
        <p class="text-warning text-bold">💥 Błąd SQL:</p>
        <span>{{ sqlError }}</span>
      </q-card-section>
    </q-card>

    <q-list bordered class="rounded-borders q-mt-lg">
      <q-expansion-item expand-separator icon="question_mark" label="Pokaż podpowiedź">
        <q-card style="max-width: 600px">
          <q-card-section>
            <p>Spróbuj w polu <strong>ID posta</strong> użyć payloadu generującego błąd lub sterującego logiką SQL:</p>
            <ul>
              <ul>

                <li>
                  <pre><code>1 --</code></pre>
                  <p>➡️ <code>Podstawowy test</code> – sprawdza, czy możemy uciąć resztę zapytania SQL. Jeśli zadziała,
                    aplikacja prawdopodobnie jest podatna na SQL Injection.</p>
                </li>

                <li>
                  <pre><code>1 AND 1=1 --</code></pre>
                  <p>➡️ <code>Zawsze prawda</code> – jeśli strona działa normalnie, to znaczy, że nasz kod jest
                    wykonywany. Służy do potwierdzenia działania iniekcji.</p>
                </li>

                <li>
                  <pre><code>1 AND 1=0 --</code></pre>
                  <p>➡️ <code>Zawsze fałsz</code> – jeśli strona zwróci pusty wynik, to wiemy, że możemy
                    sterować logiką SQL przez nasz payload (404, nie błąd SQL).</p>
                </li>

                <li>
                  <pre><code>1 ORDER BY 1 --</code></pre>
                  <p>➡️ <code>Test liczby kolumn</code> – sprawdza, czy zapytanie zawiera co najmniej jedną kolumnę.
                    Zmieniamy liczbę (1, 2, 3...) aż do błędu, by wykryć limit.</p>
                </li>

                <li>
                  <pre><code>1 UNION SELECT 1,2,3 --</code></pre>
                  <p>➡️ <code>Test UNION</code> – próbujemy połączyć nasze dane z wynikami zapytania oryginalnego.
                    Liczba wartości musi się zgadzać z liczbą kolumn — inaczej zobaczysz błąd SQL.</p>
                </li>

                <li>
                  <pre><code>1 AND SUBSTR((SELECT sqlite_version()), 1, 1) = '3' --</code></pre>
                  <p>➡️ <code>Warunkowa prawda</code> – jeśli warunek jest prawdziwy i post o ID=1 istnieje, zobaczysz
                    wynik. Użyj istniejącego ID (np. 1), nie 111.</p>
                </li>

                <li>
                  <pre><code>1 AND typeof(id) = 'text' --</code></pre>
                  <p>➡️ <code>Sprawdzenie typu kolumny</code> – jeśli typ nie pasuje, możemy zmienić zachowanie
                    zapytania. Pomocne przy budowaniu warunków błędu.</p>
                </li>

                <li>
                  <pre><code>1 AND not_a_function() --</code></pre>
                  <p>➡️ <code>Błąd: no such function</code> – używamy nieistniejącej funkcji, by wymusić błąd serwera.
                    To technika error-based SQLi — szczegóły błędu powinny być widoczne poniżej.</p>
                </li>

              </ul>
            </ul>
          </q-card-section>
        </q-card>
      </q-expansion-item>

      <q-expansion-item expand-separator icon="warning" label="Dlaczego jest to niebezpieczne?">
        <q-card style="max-width: 600px">
          <q-card-section>
            <p><strong>Error-Based SQL Injection</strong> wykorzystuje komunikaty o błędach do wyciągania informacji z
              bazy danych.</p>
            <p>Jeśli serwer nie filtruje błędów SQL, napastnik może:</p>
            <ul>
              <li>Poznać strukturę bazy (liczbę kolumn, nazwy tabel)</li>
              <li>Wydobywać wartości z SELECT-ów (poprzez błędy)</li>
              <li>Eksploitować backend przez manipulację zapytaniami</li>
            </ul>
          </q-card-section>
        </q-card>
      </q-expansion-item>
      <q-expansion-item expand-separator icon="code" label="Przykład podatnego kodu (backend)">
        <q-card style="max-width: 700px">
          <q-card-section>
            <p>Oto przykład uproszczonego kodu backendowego w Node.js z użyciem SQLite:</p>
            <pre><code>
// NIEBEZPIECZNE! Wstrzykiwanie bez walidacji:
const query = `SELECT * FROM posts WHERE id = ${req.query.id}`

db.get(query, (err, row) => {
  if (err) {
    res.status(500).json({ error: err.message })  // Tu ujawniany jest błąd SQL
  } else if (row) {
    res.json(row)
  } else {
    res.status(404).json({ error: 'Post nie został znaleziony' })
  }
})
      </code></pre>

            <p><strong>Dlaczego to jest złe?</strong></p>
            <ul>
              <li>Parametry od użytkownika są wstrzykiwane bez walidacji.</li>
              <li>Komunikaty o błędach są zwracane w odpowiedzi – to umożliwia atakującemu analizę błędów SQL.</li>
              <li>Brak użycia przygotowanych zapytań (prepared statements).</li>
            </ul>
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </q-list>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { api } from 'src/boot/axios'

  const postId = ref<string>('1')
  const post = ref<any | null>(null)
  const sqlError = ref<string | null>(null)
  const notFound = ref(false)
  const blockedBy = ref<string | null>(null)
  const requestMade = ref(false)

  const fetchPost = async () => {
    post.value = null
    sqlError.value = null
    notFound.value = false
    blockedBy.value = null
    requestMade.value = false

    try {
      const response = await api.get('/post', {
        params: { id: postId.value },
      })

      post.value = response.data
    } catch (error: any) {
      post.value = null
      const status = error?.response?.status
      const data = error?.response?.data

      if (status === 404) {
        notFound.value = true
      } else if (status === 500 && (data?.sqlError || data?.error)) {
        sqlError.value = data.error
      } else if (data?.blockedBy) {
        blockedBy.value = data.blockedBy
        sqlError.value = data.error
      } else if (data?.error) {
        sqlError.value = data.error
      } else {
        sqlError.value = error.message || 'Nieznany błąd'
      }
    } finally {
      requestMade.value = true
    }
  }
</script>
