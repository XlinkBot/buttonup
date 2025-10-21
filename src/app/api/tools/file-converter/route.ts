import { NextRequest, NextResponse } from 'next/server';
import { HttpsProxyAgent } from 'https-proxy-agent';
import axios, { AxiosError } from 'axios';

export async function POST(request: NextRequest) {
  try {
    // Get the external API URLs from environment variables
    const pdfToolApiUrl = process.env.MARKDOWN_TOOL_API_URL || 'https://markdown-tool-gules.vercel.app';
    const officeToolApiUrl = process.env.OFFICE_TOOL_API_URL || 'https://office-converter.example.com';
    
    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Validate file type and determine service
    const fileName = file.name.toLowerCase();
    const fileType = file.type;
    
    let serviceUrl: string;
    let supportedTypes: string[];
    
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      serviceUrl = pdfToolApiUrl;
      supportedTypes = ['PDF'];
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      fileName.endsWith('.docx')
    ) {
      serviceUrl = officeToolApiUrl;
      supportedTypes = ['DOCX'];
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || 
      fileName.endsWith('.pptx')
    ) {
      serviceUrl = officeToolApiUrl;
      supportedTypes = ['PPTX'];
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Only PDF, DOCX, and PPTX files are supported.' },
        { status: 400 }
      );
    }
    
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 413 }
      );
    }
    
    // Create new FormData for forwarding
    const forwardFormData = new FormData();
    forwardFormData.append('file', file);
    
    // Add file type information to headers
    const headers: Record<string, string> = {
      'Content-Type': 'multipart/form-data',
      'X-File-Type': fileType,
      'X-File-Extension': fileName.split('.').pop() || '',
    };
    
    console.log(`Forwarding ${supportedTypes.join('/')} file to ${serviceUrl}/api/convert/file`);

    // Forward the request to the external service using axios
    let response;
    try {
      if (process.env.NODE_ENV === 'development') {
        // Use proxy in development environment
        response = await axios.post(`${serviceUrl}/api/convert/file`, forwardFormData, {
          headers,
          httpsAgent: new HttpsProxyAgent(process.env.HTTP_PROXY || process.env.HTTPS_PROXY || ''),
        });
      } else {
        // Direct access in production
        response = await axios.post(`${serviceUrl}/api/convert/file`, forwardFormData, {
          headers,
        });
      }
    } catch (axiosError: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      // Handle axios errors
      if (axiosError.response) {
        const errorData = axiosError.response.data || { detail: 'External service error' };
        return NextResponse.json(
          { error: errorData.detail || `Failed to convert ${supportedTypes.join('/')} file` },
          { status: axiosError.response.status }
        );
      } else {
        return NextResponse.json(
          { error: 'Network error or service unavailable' },
          { status: 502 }
        );
      }
    }
    
    const result = response.data;
    
    // Return the markdown result
    return NextResponse.json({
      success: true,
      markdown: result.markdown,
      metadata: result.metadata,
      filename: file.name,
      fileType: file.type
    });
    
  } catch (error) {
    console.error('File conversion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


//GET /api/tools/file-converter
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'File Converter API',
    supportedTypes: ['PDF', 'DOCX', 'PPTX'],
    maxFileSize: '5MB'
  });
}
