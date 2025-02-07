import Header from '@/components/header'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const faqs = [
  {
    question: "What is the School of Encounter?",
    answer: "The School of Encounter is an online platform offering courses in spiritual growth, including topics like spiritual warfare, intercession, and kingdom leadership. Our goal is to equip believers with practical tools for their spiritual journey."
  },
  {
    question: "How long do courses typically last?",
    answer: "Course durations vary, but most of our courses run between 6 to 12 weeks. Each course page provides specific information about its length."
  },
  {
    question: "Are the courses self-paced or do they have set start dates?",
    answer: "We offer both self-paced and cohort-based courses. Self-paced courses can be started at any time, while cohort-based courses have specific start dates. Check each course's details for more information."
  },
  {
    question: "What kind of support is available during the courses?",
    answer: "All courses include access to a dedicated online community where you can interact with fellow students and instructors. Additionally, we offer weekly live Q&A sessions for most courses."
  },
  {
    question: "Is there a certificate upon completion?",
    answer: "Yes, upon successful completion of a course, you will receive a digital certificate that you can share on your professional networks."
  },
  {
    question: "What is your refund policy?",
    answer: "We offer a 14-day money-back guarantee for all our courses. If you're not satisfied with your course, you can request a full refund within 14 days of purchase."
  }
]

export default function FAQ() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center text-[#003ab8]">Frequently Asked Questions</h1>
        <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-lg font-semibold text-[#003ab8]">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-gray-600">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </main>
      <footer className="bg-gray-100 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2023 The School of Encounter. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

