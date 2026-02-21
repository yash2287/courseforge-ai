import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate and extract parameters
    const {
      lessonTitle,
      lessonContent,
      numberOfQuestions = 5,
      difficulty,
    } = body;

    if (!lessonTitle || !lessonContent || !difficulty) {
      return NextResponse.json(
        { error: 'Missing required fields: lessonTitle, lessonContent, difficulty' },
        { status: 400 }
      );
    }

    // Validate number of questions
    if (numberOfQuestions < 1 || numberOfQuestions > 50) {
      return NextResponse.json(
        { error: 'numberOfQuestions must be between 1 and 50' },
        { status: 400 }
      );
    }

    // Validate API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Initialize Gemini AI
    const ai = new GoogleGenAI({ apiKey });

    // Create detailed prompt for quiz generation
    const prompt = `You are an expert assessment designer. Generate quiz questions based on the lesson content provided.

Lesson Title: ${lessonTitle}
Difficulty Level: ${difficulty}
Number of Questions: ${numberOfQuestions}

Lesson Content:
${lessonContent}

Requirements:
1. Generate exactly ${numberOfQuestions} multiple-choice questions
2. Each question should have 4 options (labeled A, B, C, D)
3. Questions should test:
   - Comprehension of key concepts
   - Application of knowledge to practical scenarios
   - Critical thinking and analysis
4. Difficulty should match the ${difficulty} level
5. Include clear, educational explanations for why the correct answer is right
6. Ensure questions are relevant to the lesson content
7. Vary question types (concept recall, application, analysis, problem-solving)

Return ONLY valid JSON array (no markdown code blocks, no additional text) with this exact structure:
[
  {
    "question": "string (the question text)",
    "options": ["string (option A)", "string (option B)", "string (option C)", "string (option D)"],
    "correctAnswer": number (0-3, where 0 is the first option),
    "explanation": "string (why this answer is correct and why others are incorrect)"
  }
]

Generate the quiz questions now:`;

    // Call Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    // Extract text from response
    const responseText = response.text ?? '';

    // Parse JSON from response (handle potential markdown code blocks)
    let questions;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
                       responseText.match(/```\n?([\s\S]*?)\n?```/) ||
                       [null, responseText];

      const jsonString = jsonMatch[1] || responseText;
      questions = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse generated quiz data' },
        { status: 500 }
      );
    }

    // Validate the structure
    if (!Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'Invalid quiz structure received from AI' },
        { status: 500 }
      );
    }

    // Validate each question
    const validatedQuestions = questions.map((q, index) => {
      if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 ||
          typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3 ||
          !q.explanation) {
        throw new Error(`Question ${index + 1} has invalid structure`);
      }
      return q;
    });

    return NextResponse.json({
      success: true,
      data: validatedQuestions,
      count: validatedQuestions.length,
    });

  } catch (error) {
    console.error('Error generating quiz:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate quiz. Please try again.' },
      { status: 500 }
    );
  }
}
