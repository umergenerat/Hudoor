
import { GoogleGenAI, Type } from "@google/genai";
import { Student, ClassGroup } from "../types";

export interface ParsedAttendanceItem {
  studentName: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  minutesLate?: number;
  notes?: string;
}

export const analyzeAttendanceImage = async (base64Image: string, mimeType: string = 'image/jpeg', apiKey?: string): Promise<ParsedAttendanceItem[]> => {
  // Use provided key or fallback to env
  const key = apiKey || process.env.API_KEY || '';

  if (!key) {
    console.warn("API Key is missing. Returning mock data.");
    // Fallback mock for demonstration if key is missing
    return [
      { studentName: "Ahmed Ali", status: "present" },
      { studentName: "Jean Dupont", status: "absent", notes: "Sick leave" },
      { studentName: "Sarah Connor", status: "late", minutesLate: 15 }
    ];
  }

  const ai = new GoogleGenAI({ apiKey: key });

  // Schema for structured output
  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        studentName: { type: Type.STRING, description: "The full name of the student" },
        status: { type: Type.STRING, enum: ["present", "absent", "late", "excused"], description: "The attendance status" },
        minutesLate: { type: Type.NUMBER, description: "If late, how many minutes (integer)" },
        notes: { type: Type.STRING, description: "Any handwritten notes regarding the attendance" }
      },
      required: ["studentName", "status"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Using flash for speed/efficiency
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType, 
              data: base64Image
            }
          },
          {
            text: `Analyze this attendance sheet. Extract the list of students and their attendance status.
                   - If a checkmark is in the "Present" column, status is 'present'.
                   - If in "Absent", status is 'absent'.
                   - If "Late", status is 'late'.
                   - Interpret handwriting for names and notes.
                   - Return pure JSON.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1 // Low temperature for high determination
      }
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text) as ParsedAttendanceItem[];

  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    throw new Error("Failed to process image. check API Key.");
  }
};

interface ParsedClassList {
  students: {
    firstName: string;
    lastName: string;
    studentCode: string;
  }[];
  className: string;
  grade: string;
}

export const parseStudentList = async (base64Data: string, mimeType: string, apiKey?: string): Promise<ParsedClassList> => {
  const key = apiKey || process.env.API_KEY || '';

  if (!key) {
    throw new Error("API Key missing");
  }

  const ai = new GoogleGenAI({ apiKey: key });

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      className: { type: Type.STRING, description: "The name of the class or section found in the document header." },
      grade: { type: Type.STRING, description: "The grade level inferred from the class name (e.g., '10', '11')." },
      students: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            firstName: { type: Type.STRING },
            lastName: { type: Type.STRING },
            studentCode: { type: Type.STRING, description: "Student ID code if visible, otherwise generate a placeholder." }
          },
          required: ["firstName", "lastName"]
        }
      }
    },
    required: ["students", "className"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: `Extract the class list from this document. 
                   Identify the Class Name and Grade. 
                   Extract all student names (FirstName, LastName) and Codes.
                   If the document is a table, read rows.
                   Return JSON.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No data returned");
    return JSON.parse(text) as ParsedClassList;

  } catch (error) {
    console.error("Error parsing class list with Gemini:", error);
    throw error;
  }
};