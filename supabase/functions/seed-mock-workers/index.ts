import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const mockWorkers = [
  { email: 'anna.kowalska@test.com', name: 'Anna Kowalska', bio: 'Doświadczona sprzątaczka z 5-letnim stażem', wojewodztwo: 'mazowieckie', miasto: 'Warszawa', hourly_rate: 45, rating_avg: 4.8, rating_count: 12 },
  { email: 'piotr.nowak@test.com', name: 'Piotr Nowak', bio: 'Specjalista od przeprowadzek i prac fizycznych', wojewodztwo: 'małopolskie', miasto: 'Kraków', hourly_rate: 55, rating_avg: 4.5, rating_count: 8 },
  { email: 'maria.wisniewska@test.com', name: 'Maria Wiśniewska', bio: 'Opieka nad osobami starszymi i dziećmi', wojewodztwo: 'wielkopolskie', miasto: 'Poznań', hourly_rate: 40, rating_avg: 4.9, rating_count: 15 },
  { email: 'tomasz.kaminski@test.com', name: 'Tomasz Kamiński', bio: 'Złota rączka - naprawy i montaż', wojewodztwo: 'dolnośląskie', miasto: 'Wrocław', hourly_rate: 60, rating_avg: 4.7, rating_count: 20 },
  { email: 'katarzyna.lewandowska@test.com', name: 'Katarzyna Lewandowska', bio: 'Profesjonalne sprzątanie biur i mieszkań', wojewodztwo: 'łódzkie', miasto: 'Łódź', hourly_rate: 42, rating_avg: 4.6, rating_count: 9 },
  { email: 'marcin.zielinski@test.com', name: 'Marcin Zieliński', bio: 'Kierowca z własnym busem - transport', wojewodztwo: 'pomorskie', miasto: 'Gdańsk', hourly_rate: 70, rating_avg: 4.4, rating_count: 6 },
  { email: 'agnieszka.szymanska@test.com', name: 'Agnieszka Szymańska', bio: 'Pomoc domowa i opieka nad zwierzętami', wojewodztwo: 'śląskie', miasto: 'Katowice', hourly_rate: 38, rating_avg: 4.3, rating_count: 4 },
  { email: 'krzysztof.wozniak@test.com', name: 'Krzysztof Woźniak', bio: 'Elektryk i hydraulik z uprawnieniami', wojewodztwo: 'mazowieckie', miasto: 'Warszawa', hourly_rate: 80, rating_avg: 4.9, rating_count: 25 },
  { email: 'ewa.dabrowska@test.com', name: 'Ewa Dąbrowska', bio: 'Catering i obsługa eventów', wojewodztwo: 'małopolskie', miasto: 'Kraków', hourly_rate: 50, rating_avg: 4.5, rating_count: 11 },
  { email: 'adam.kozlowski@test.com', name: 'Adam Kozłowski', bio: 'Ogrodnik - pielęgnacja ogrodów i trawników', wojewodztwo: 'wielkopolskie', miasto: 'Poznań', hourly_rate: 45, rating_avg: 4.7, rating_count: 14 },
  { email: 'joanna.jankowska@test.com', name: 'Joanna Jankowska', bio: 'Korepetycje i pomoc w nauce', wojewodztwo: 'dolnośląskie', miasto: 'Wrocław', hourly_rate: 65, rating_avg: 4.8, rating_count: 18 },
  { email: 'pawel.mazur@test.com', name: 'Paweł Mazur', bio: 'Malowanie i drobne remonty', wojewodztwo: 'łódzkie', miasto: 'Łódź', hourly_rate: 55, rating_avg: 4.2, rating_count: 7 },
  { email: 'magdalena.krawczyk@test.com', name: 'Magdalena Krawczyk', bio: 'Organizacja przyjęć i dekoracje', wojewodztwo: 'pomorskie', miasto: 'Gdańsk', hourly_rate: 48, rating_avg: 4.6, rating_count: 10 },
  { email: 'rafal.piotrowski@test.com', name: 'Rafał Piotrowski', bio: 'Montaż mebli IKEA i innych', wojewodztwo: 'śląskie', miasto: 'Katowice', hourly_rate: 52, rating_avg: 4.4, rating_count: 8 },
  { email: 'aleksandra.grabowska@test.com', name: 'Aleksandra Grabowska', bio: 'Profesjonalne mycie okien', wojewodztwo: 'mazowieckie', miasto: 'Warszawa', hourly_rate: 35, rating_avg: 4.5, rating_count: 13 },
  { email: 'michal.pawlowski@test.com', name: 'Michał Pawłowski', bio: 'Pomoc przy eventach i imprezach', wojewodztwo: 'małopolskie', miasto: 'Kraków', hourly_rate: 40, rating_avg: 4.1, rating_count: 5 },
  { email: 'natalia.michalska@test.com', name: 'Natalia Michalska', bio: 'Sprzątanie po remontach', wojewodztwo: 'wielkopolskie', miasto: 'Poznań', hourly_rate: 50, rating_avg: 4.7, rating_count: 16 },
  { email: 'jakub.wojcik@test.com', name: 'Jakub Wójcik', bio: 'Dostawy rowerowe i kurierskie', wojewodztwo: 'dolnośląskie', miasto: 'Wrocław', hourly_rate: 30, rating_avg: 4.3, rating_count: 9 },
  { email: 'monika.kwiatkowska@test.com', name: 'Monika Kwiatkowska', bio: 'Opieka nad dziećmi - niania', wojewodztwo: 'łódzkie', miasto: 'Łódź', hourly_rate: 45, rating_avg: 4.8, rating_count: 22 },
  { email: 'lukasz.zajac@test.com', name: 'Łukasz Zając', bio: 'Pomoc informatyczna i naprawy komputerów', wojewodztwo: 'pomorskie', miasto: 'Gdańsk', hourly_rate: 75, rating_avg: 4.6, rating_count: 11 },
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const createdWorkers = []

    for (const worker of mockWorkers) {
      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: worker.email,
        password: 'TestPassword123!',
        email_confirm: true,
        user_metadata: { name: worker.name, role: 'worker' }
      })

      if (authError) {
        console.log(`Skipping ${worker.email}: ${authError.message}`)
        continue
      }

      if (authData.user) {
        // Update profile with worker data
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({
            role: 'worker',
            name: worker.name,
            bio: worker.bio,
            wojewodztwo: worker.wojewodztwo,
            miasto: worker.miasto,
            hourly_rate: worker.hourly_rate,
            rating_avg: worker.rating_avg,
            rating_count: worker.rating_count,
            is_available: true
          })
          .eq('user_id', authData.user.id)

        if (!profileError) {
          createdWorkers.push(worker.name)
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, created: createdWorkers.length, workers: createdWorkers }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
