import { Layout } from "@/components/layout/Layout";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
	const faqs = [
		{
			question: "Jak mogę dodać zlecenie?",
			answer:
				'Aby dodać zlecenie, zaloguj się na swoje konto, kliknij "Dodaj zlecenie" i wypełnij formularz.',
		},
		{
			question: "Ile kosztuje publikacja zlecenia?",
			answer: "Publikacja zlecenia jest całkowicie za darmo",
		},
		{
			question: "Czy jako wykonawca muszę płacić?",
			answer:
				"Nie! Przeglądanie zleceń, składanie ofert i kontakt ze zleceniodawcami jest całkowicie bezpłatny dla wykonawców.",
		},
		{
			question: "Jak wybrać wykonawcę?",
			answer:
				"Po otrzymaniu ofert możesz przejrzeć profile wykonawców, ich oceny i opinie. Wybierz tego, który najlepiej odpowiada Twoim potrzebom i skontaktuj się przez czat.",
		},
		{
			question: "Czy moje dane są bezpieczne?",
			answer:
				"Tak, dbamy o bezpieczeństwo danych, a dane osobowe są chronione zgodnie z RODO.",
		},
		{
			question: "Jak działa system ocen?",
			answer:
				"Po zakończeniu zlecenia obie strony mogą wystawić sobie oceny i opinie. Pomaga to budować wiarygodność i ułatwia przyszłym użytkownikom wybór.",
		},
		{
			question: "Czy mogę edytować zlecenie po publikacji?",
			answer:
				'Tak, możesz edytować swoje zlecenie w dowolnym momencie, dopóki jest aktywne. Wejdź w szczegóły zlecenia i kliknij "Edytuj zlecenie".',
		},
		{
			question: "Jak mogę usunąć swoje konto?",
			answer:
				"Aby usunąć konto, skontaktuj się z nami przez formularz pomocy. Usuniemy Twoje dane zgodnie z obowiązującymi przepisami.",
		},
	];

	return (
		<Layout>
			<div className="container py-12">
				<div className="max-w-3xl mx-auto">
					<h1 className="text-4xl font-bold text-center mb-4">
						Najczęściej zadawane pytania
					</h1>
					<p className="text-muted-foreground text-center mb-12 text-lg">
						Znajdź odpowiedzi na najczęstsze pytania dotyczące ZlecenieTeraz.
					</p>

					<Accordion type="single" collapsible className="w-full">
						{faqs.map((faq, index) => (
							<AccordionItem key={index} value={`item-${index}`}>
								<AccordionTrigger className="text-left">
									{faq.question}
								</AccordionTrigger>
								<AccordionContent className="text-muted-foreground">
									{faq.answer}
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				</div>
			</div>
		</Layout>
	);
};

export default FAQ;
