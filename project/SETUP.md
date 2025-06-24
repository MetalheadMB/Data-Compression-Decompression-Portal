# Setup Instructions for GitHub

Follow these steps to push this project to your GitHub repository:

## Step 1: Download Project Files

1. Download all the project files from this WebContainer environment
2. Create a new folder on your local machine called `compression-portal`
3. Copy all the downloaded files into this folder

## Step 2: Initialize Git Repository

Open terminal/command prompt in your project folder and run:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Make initial commit
git commit -m "Initial commit: Data Compression & Decompression Portal

- Implemented Huffman Coding, RLE, and LZ77 compression algorithms
- Created responsive React UI with TypeScript
- Added file upload with drag & drop functionality
- Implemented real-time compression progress tracking
- Added compression statistics and download functionality
- Responsive design with Tailwind CSS and Framer Motion animations"
```

## Step 3: Connect to GitHub Repository

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name:

```bash
# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git push -u origin main
```

## Step 4: Verify Upload

1. Go to your GitHub repository
2. Refresh the page
3. You should see all the project files uploaded

## Step 5: Set Up GitHub Pages (Optional)

To deploy your project using GitHub Pages:

1. Go to your repository settings
2. Scroll down to "Pages" section
3. Select "GitHub Actions" as the source
4. Create `.github/workflows/deploy.yml` with the provided workflow

## Troubleshooting

### If you get authentication errors:
- Make sure you're logged into GitHub
- Use a personal access token instead of password
- Or use GitHub CLI: `gh auth login`

### If the repository doesn't exist:
- Create it first on GitHub.com
- Or use: `gh repo create YOUR_REPO_NAME --public`

### If you get permission errors:
- Make sure you have write access to the repository
- Check if you're pushing to the correct repository URL

## Next Steps

After successful upload:
1. Update the README.md with your actual GitHub username
2. Add a live demo link if you deploy the project
3. Consider adding GitHub Actions for automatic deployment
4. Add issues and project boards for better project management

## File Structure Verification

Make sure your repository contains these files:
- `src/` folder with all React components
- `package.json` with all dependencies
- `README.md` with project documentation
- `.gitignore` to exclude node_modules
- `LICENSE` file
- All configuration files (tsconfig.json, vite.config.ts, etc.)