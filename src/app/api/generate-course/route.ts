import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const {
      title,
      description,
      companyName,
      industry,
      targetAudience,
      difficulty,
      numberOfModules = 4,
      lessonsPerModule = 3,
    } = body;

    if (!title || !description || !companyName || !industry || !targetAudience || !difficulty) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, companyName, industry, targetAudience, difficulty' },
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

    // Create detailed prompt for course generation
    const prompt = `You are an expert curriculum designer. Generate a training course as JSON.

Course Details:
- Title: ${title}
- Description: ${description}
- Company: ${companyName}
- Industry: ${industry}
- Target Audience: ${targetAudience}
- Difficulty Level: ${difficulty}
- Number of Modules: ${numberOfModules}
- Lessons per Module: ${lessonsPerModule}

Requirements:
1. Create exactly ${numberOfModules} modules
2. Each module should have exactly ${lessonsPerModule} lessons
3. Make content relevant to ${companyName} and the ${industry} industry
4. Each lesson content should be detailed markdown (200-300 words) with clear explanations, practical examples, and actionable guidance
5. Include 3 key takeaways per lesson
6. Provide realistic time estimates

Return this exact JSON structure:
{
  "title": "string",
  "description": "string",
  "modules": [
    {
      "title": "string",
      "description": "string",
      "estimatedDuration": "string (e.g., '2 hours')",
      "lessons": [
        {
          "title": "string",
          "content": "string (detailed markdown)",
          "keyTakeaways": ["string", "string", "string"],
          "estimatedDuration": "string (e.g., '30 minutes')"
        }
      ]
    }
  ]
}`;

    // Call Gemini with JSON mode
    let responseText = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          maxOutputTokens: 65536,
        },
      });
      responseText = response.text ?? '';
    } catch (apiError: any) {
      console.error('Gemini API error:', apiError.message || apiError);
      return NextResponse.json(
        { error: 'AI service error. Please try again.' },
        { status: 502 }
      );
    }

    if (!responseText || responseText.trim().length === 0) {
      console.error('Empty response from Gemini');
      return NextResponse.json(
        { error: 'AI returned an empty response. Please try again.' },
        { status: 500 }
      );
    }

    console.log('Gemini response length:', responseText.length);

    // Parse JSON from response
    let courseData: any;
    try {
      let jsonString = responseText.trim();
      // Remove markdown code blocks if present
      const jsonMatch = jsonString.match(/```json\n?([\s\S]*?)\n?```/) ||
                       jsonString.match(/```\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        jsonString = jsonMatch[1].trim();
      }
      courseData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON parse error:', (parseError as Error).message);
      console.error('Response length:', responseText.length);
      console.error('Response first 500 chars:', responseText.substring(0, 500));
      console.error('Response last 500 chars:', responseText.substring(responseText.length - 500));
      return NextResponse.json(
        { error: 'Failed to parse generated course data. The AI response was malformed. Please try again.' },
        { status: 500 }
      );
    }

    // Handle various response structures from Gemini
    // It may return an array, nest under a key, or return directly
    if (Array.isArray(courseData)) {
      courseData = { title, description, modules: courseData };
    } else if (!courseData.modules) {
      // Look for modules nested under any key
      const keys = Object.keys(courseData);
      console.log('Parsed JSON keys:', keys);
      const found = keys.find(
        (k) => Array.isArray(courseData[k]) && courseData[k].length > 0 && courseData[k][0].lessons
      );
      if (found) {
        courseData = { ...courseData, modules: courseData[found] };
      } else if (courseData.course && courseData.course.modules) {
        courseData = courseData.course;
      }
    }

    if (!courseData.modules || !Array.isArray(courseData.modules)) {
      console.error('Unexpected structure. Keys:', Object.keys(courseData));
      console.error('Sample:', JSON.stringify(courseData).substring(0, 500));
      return NextResponse.json(
        { error: 'Invalid course structure received from AI' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: courseData,
    });

  } catch (error) {
    console.error('Error generating course:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate course. Please try again.' },
      { status: 500 }
    );
  }
}
