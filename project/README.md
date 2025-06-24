# Data Compression & Decompression Portal

A modern web application that allows users to upload files and apply various data compression algorithms including Huffman coding, Run-Length Encoding (RLE), and LZ77.

![Compression Portal](https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=1200&h=400&fit=crop)

## 🚀 Features

- **📁 File Upload**: Support for text files, documents, and various data formats (up to 50MB)
- **🔧 Multiple Compression Algorithms**: 
  - Huffman Coding (Variable-length encoding)
  - Run-Length Encoding (RLE)
  - LZ77 (Dictionary-based compression)
- **Real-time Progress**: Visual feedback during compression process
- **Compression Statistics**: Display compression ratio, file sizes, and processing time
- **Download Functionality**: Download compressed and decompressed files
- **Responsive Design**: Modern UI with smooth animations
- **Algorithm Education**: Detailed explanations of each compression algorithm

## 🛠️ Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Linting**: ESLint with TypeScript support

## 📦 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/compression-portal.git
cd compression-portal
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🧮 Compression Algorithms

### Huffman Coding
- **Description**: Uses variable-length codes based on character frequency
- **Best for**: Text files, source code, natural language
- **Time Complexity**: O(n log n)
- **Space Efficiency**: Excellent for text with varied character frequencies

### Run-Length Encoding (RLE)
- **Description**: Replaces consecutive identical characters with count + character
- **Best for**: Images with large uniform areas, repetitive data
- **Time Complexity**: O(n)
- **Space Efficiency**: Great for data with long runs of identical values

### LZ77
- **Description**: Replaces repeated substrings with references to previous occurrences
- **Best for**: General text, documents, mixed content
- **Time Complexity**: O(n²)
- **Space Efficiency**: Good general-purpose compression

## 🏗️ Project Structure

```
compression-portal/
├── src/
│   ├── components/          # React components
│   │   ├── AlgorithmSelector.tsx
│   │   ├── CompressionProgress.tsx
│   │   ├── CompressionResults.tsx
│   │   ├── FileUpload.tsx
│   │   └── Header.tsx
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/              # Utility functions
│   │   └── compressionAlgorithms.ts
│   ├── App.tsx             # Main application component
│   ├── index.css           # Global styles
│   ├── main.tsx            # Application entry point
│   └── vite-env.d.ts       # Vite type definitions
├── index.html              # HTML template
├── package.json            # Dependencies and scripts
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
└── README.md               # Project documentation
```

## 🎯 Usage

1. **Upload a File**: Drag and drop or click to select a file (text files work best)
2. **Choose Algorithm**: Select from Huffman, RLE, or LZ77 based on your file type
3. **Start Compression**: Watch the real-time progress as your file is processed
4. **View Results**: See compression statistics and download the compressed file
5. **Decompress** (if supported): Download the decompressed version to verify integrity

## 🔧 Configuration

The application supports various file types and has configurable limits:

- **Max File Size**: 50MB
- **Supported Types**: .txt, .json, .csv, .log, and other text formats
- **Compression Window**: 4KB for LZ77 algorithm
- **Look-ahead Buffer**: 18 bytes for LZ77 algorithm

## 🚀 Deployment

The project is configured for easy deployment on platforms like:

- **Netlify**: Drag and drop the `dist` folder after running `npm run build`
- **Vercel**: Connect your GitHub repository for automatic deployments
- **GitHub Pages**: Use GitHub Actions for automated deployment

### Build for Production

```bash
npm run build
```

This creates a `dist` folder with optimized production files.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



## 🙏 Acknowledgments

- Compression algorithms implemented based on standard computer science principles
- UI/UX inspired by modern web design practices
- Icons provided by [Lucide React](https://lucide.dev/)
- Animations powered by [Framer Motion](https://www.framer.com/motion/)

## 📞 Support

If you have any questions or run into issues:
Check the Issues page
Create a new issue with detailed information
Contact the maintainers

---

**Made with ❤️ by Mitul**