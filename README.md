# Daily Content Blog

A modern, AI-friendly blog that automatically fetches content from Notion and presents it in a clean, searchable format. Built with Next.js 15, TypeScript, and Tailwind CSS.

## Features

- 📝 **Notion Integration**: Automatically fetches content from Notion databases
- 🔍 **Advanced Search**: Full-text search with tag and date filtering
- 📱 **Responsive Design**: Works perfectly on all devices
- 📰 **RSS Feed**: Subscribe to content updates
- 📧 **Email Subscription**: Get notified of new content
- 🏷️ **Tag System**: Organize content with tags
- 📅 **Archive View**: Browse content by date
- 🤖 **AI-Friendly**: Includes llm.txt for AI systems
- ⚡ **Fast Performance**: Built with Next.js App Router with static generation
- 💾 **Smart Caching**: Build-time data fetching reduces API calls
- 🔄 **ISR Support**: Incremental Static Regeneration for fresh content
- 🎨 **Modern UI**: Clean, professional design

## Quick Start

1. **Clone and Install**
   ```bash
   git clone <your-repo>
   cd redditblog
   npm install
   ```

2. **Set up Notion Integration**
   - Follow the detailed guide in [NOTION_SETUP.md](./NOTION_SETUP.md)
   - Create a Notion integration and get your API key
   - Set up your Notion database with required properties
   - Get your database ID

3. **Configure Environment Variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add the following to your `.env.local`:
   ```env
   NOTION_API_KEY=your-notion-integration-api-key
   NOTION_DATABASE_ID=your-notion-database-id
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   NEXT_PUBLIC_SITE_TITLE="Daily Content Blog"
   NEXT_PUBLIC_SITE_DESCRIPTION="Daily content from Notion"
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Visit** `http://localhost:3000`

## Build and Deployment Commands

### Development
```bash
npm run dev          # Start development server
```

### Production Build
```bash
npm run build        # Build with Next.js ISR
npm run start        # Start production server
```

## Content Format

### File Naming Convention
Your Google Drive files should follow this format:
```
YYYY-MM-DD-title.txt
```

Examples:
- `2024-01-15-my-daily-thoughts.txt`
- `2024-01-16-weekend-adventures.txt`
- `2024-01-17-work-updates.txt`

### Content Structure
Each file should contain:
- Plain text content
- Optional tags using `#tag` format
- Any formatting you want in the content

Example content:
```
# My Daily Thoughts

Today was an interesting day. I learned something new about web development.

#webdev #learning #daily

The weather was beautiful, and I spent some time outside reading.
```

## Google Drive Setup

1. **Create a Service Account**
   - Go to Google Cloud Console
   - Navigate to IAM & Admin > Service Accounts
   - Create a new service account
   - Download the JSON key file

2. **Enable Google Drive API**
   - Go to APIs & Services > Library
   - Search for "Google Drive API"
   - Enable it for your project

3. **Share Your Folder**
   - Create a folder in Google Drive for your content
   - Share it with your service account email (from the JSON file)
   - Give it "Viewer" permissions
   - Copy the folder ID from the URL

4. **Configure Environment**

   **Method 1: JSON Key File (Recommended for Local Development)**
   ```env
   GOOGLE_KEY_FILE_PATH=./path/to/your-service-account-key.json
   GOOGLE_DRIVE_FOLDER_ID=your-folder-id
   ```
   
   **Method 2: JSON Content as Environment Variable (For Deployment)**
   ```env
   GOOGLE_KEY_FILE_JSON={"type":"service_account","project_id":"your-project",...}
   GOOGLE_DRIVE_FOLDER_ID=your-folder-id
   ```
   
   **Method 3: Manual Configuration (Fallback)**
   ```env
   GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
   GOOGLE_DRIVE_FOLDER_ID=your-folder-id
   ```

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `GOOGLE_KEY_FILE_JSON`: Paste your entire JSON key file content as a single line
   - `GOOGLE_DRIVE_FOLDER_ID`: Your Google Drive folder ID
   - `NEXT_PUBLIC_SITE_URL`: Your domain URL
   - `NEXT_PUBLIC_SITE_TITLE`: Your site title
   - `NEXT_PUBLIC_SITE_DESCRIPTION`: Your site description
4. Deploy!

**Note**: For Vercel, use the `GOOGLE_KEY_FILE_JSON` method as it's easier to manage than file uploads.

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Customization

### Styling
The app uses Tailwind CSS. You can customize:
- Colors in `tailwind.config.ts`
- Components in the `/src/components` directory
- Global styles in `src/app/globals.css`

### Content Processing
Modify `src/lib/googleDrive.ts` to:
- Change content parsing logic
- Add new metadata fields
- Modify tag extraction

### Search
Update `src/components/SearchResults.tsx` to:
- Add new search filters
- Modify search logic
- Add sorting options

## Performance & Caching

### Next.js ISR (Incremental Static Regeneration)
This app leverages Next.js built-in ISR for optimal performance:

1. **Static Generation**: Pages are statically generated at build time with Google Drive content
2. **ISR**: Pages automatically regenerate every 30 minutes with fresh content
3. **On-demand Revalidation**: Use `/api/revalidate` endpoint to force immediate refresh
4. **Zero Config**: No custom caching logic needed - Next.js handles everything

### How ISR Works
- **First Request**: If no cached version exists, generates page on-demand
- **Subsequent Requests**: Serves cached static page instantly
- **Background Updates**: Regenerates page in background when revalidate time expires
- **Error Handling**: Serves stale content if regeneration fails

### Manual Revalidation
```bash
# Trigger immediate content refresh
curl -X POST http://localhost:3000/api/revalidate

# With authentication (if REVALIDATE_SECRET is set)
curl -X POST http://localhost:3000/api/revalidate \
  -H "Authorization: Bearer your_secret_key"
```

## API Endpoints

- `GET /` - Home page with latest content
- `GET /content/[slug]` - Individual content page
- `GET /archive` - Archive page
- `GET /search` - Search page
- `GET /rss.xml` - RSS feed
- `GET /llm.txt` - AI-friendly interface info
- `POST /api/revalidate` - Manual cache refresh

## RSS Feed

The RSS feed is available at `/rss.xml` and includes:
- Latest 20 content items
- Full metadata (title, description, date, tags)
- Proper RSS 2.0 format
- Cached for 1 hour for performance

## AI Integration

This site includes an `llm.txt` file at `/llm.txt` that provides:
- Site structure overview
- Content format documentation
- API endpoint information
- Technical details for AI systems

## Troubleshooting

### Google Drive API Issues
- Ensure your service account has access to the folder
- Check that the Google Drive API is enabled
- Verify your credentials are correct

### Content Not Loading
- Check your Google Drive folder ID
- Ensure files are in the correct format
- Verify file permissions

### Build Errors
- Make sure all environment variables are set
- Check that all dependencies are installed
- Verify TypeScript types are correct

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this for your own projects!

## Support

If you encounter any issues:
1. Check the troubleshooting section
2. Review the Google Drive API documentation
3. Open an issue on GitHub

---

Built with ❤️ using Next.js, TypeScript, and Tailwind CSS