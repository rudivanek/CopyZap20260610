import { stripMarkdown } from './markdownUtils';

// Define the structure for a single FAQ item
interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Extracts FAQ content (question-answer pairs) from a given text.
 * This function looks for specific patterns to identify Q&A.
 * @param text The input text potentially containing FAQ content.
 * @returns An array of FaqItem objects, or an empty array if no FAQs are found.
 */
export const extractFaqContent = (text: string): FaqItem[] => {
  const faqs: FaqItem[] = []; // Initialize an empty array to store extracted FAQs
  const lines = text.split('\n');
  let currentQuestion: string | null = null;
  let currentAnswer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Enhanced regex to match various question formats:
    // 1. Numbered questions: "1. ¿Question?" or "1.) What is this?"
    // 2. Bolded questions: "**What is this?**" or "<b>What is this?</b>"
    // 3. Explicit "Question:" prefix: "Question: What is this?"
    // 4. Questions ending with question marks in numbered lists
    const questionMatch = line.match(
      /^(?:\d+\.?\s*(.+\?)\s*$|\*\*(.*?)\*\*|<b>(.*?)<\/b>|Question:\s*(.*))/i
    );

    if (questionMatch) { // If a question pattern is matched
      // If we have a pending question and answer, save it before starting a new one
      if (currentQuestion && currentAnswer.length > 0) {
        faqs.push({
          question: stripMarkdown(currentQuestion),
          answer: stripMarkdown(currentAnswer.join(' ').trim()),
        });
      }
      
      // Reset current answer for the new question
      currentAnswer = []; 

      // Extract the question text based on which group matched
      if (questionMatch[1]) { // Group 1 captures numbered questions ending with ?
        currentQuestion = questionMatch[1];
      } else if (questionMatch[2]) { // Group 2 captures bolded text (e.g., **Question**)
        currentQuestion = questionMatch[2];
      } else if (questionMatch[3]) { // Group 3 captures bolded text (e.g., <b>Question</b>)
        currentQuestion = questionMatch[3];
      } else if (questionMatch[4]) { // Group 4 captures text after "Question:"
        currentQuestion = questionMatch[4];
      } else {
        currentQuestion = line; // Fallback to the whole line if no specific group matched
      }
    } else if (currentQuestion) {
      // If we are currently processing a question, add the line to its answer
      if (line.trim()) { // Only add non-empty lines to the answer
        currentAnswer.push(line);
      }
    }
  }

  // Add the last question and answer if any are pending
  if (currentQuestion && currentAnswer.length > 0) {
    faqs.push({ // Push the last collected FAQ item
      question: stripMarkdown(currentQuestion),
      answer: stripMarkdown(currentAnswer.join(' ').trim()),
    });
  }
  return faqs;
};

// Generates a JSON-LD object for FAQPage schema
export const generateFaqSchema = (faqs: FaqItem[]): any => {
  // Return an empty object if no FAQs are provided, as per schema.org guidelines
  if (faqs.length === 0) return {}; 

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };
};

/**
 * Sanitizes FAQPage Schema by cleaning up questions and answers
 * @param faqSchema - The FAQ schema object to sanitize
 * @param maxLength - Maximum length for answers (default: 400)
 * @returns Cleaned FAQ schema
 */
export const sanitizeFAQSchema = (faqSchema: any, maxLength: number = 400): any => {
  if (!faqSchema || !faqSchema.mainEntity) return faqSchema;

  faqSchema.mainEntity = faqSchema.mainEntity.map((item: any) => {
    // Clean question name
    let cleanName = item.name
      .replace(/^\d+\.\s*/, "") // remove leading numbers + dot
      .replace(/\s+/g, " ")     // normalize spaces
      .trim();

    // Clean answer text
    let cleanText = item.acceptedAnswer.text
      .replace(/\s+/g, " ")     // normalize spaces
      .trim();

    // Optional: shorten overly long answers
    if (cleanText.length > maxLength) {
      cleanText = cleanText.substring(0, maxLength).trim() + "...";
    }

    // Ensure period at end if missing
    if (!/[.!?]$/.test(cleanText)) {
      cleanText += ".";
    }

    return {
      "@type": "Question",
      "name": cleanName,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": cleanText
      }
    };
  });

  return faqSchema;
};