const fs = require('fs');
const path = require('path');

const SOURCE_DIR = __dirname;
const OUTPUT_FILE = path.join(__dirname, 'CombinedDocs.md'); // rename to CombinedDocs.md if you prefer

const files = fs
	.readdirSync(SOURCE_DIR)
	.filter(
		(f) => f.endsWith('.md') && f !== 'README.md' && f !== '_sidebar.md'
	)
	.sort(); // Change sorting here if needed

let combinedContent = '# FishNet Documentation\n\n';

files.forEach((file) => {
	const content = fs.readFileSync(path.join(SOURCE_DIR, file), 'utf8');
	const sectionTitle = file
		.replace('.md', '')
		.replace(/([A-Z])/g, ' $1')
		.trim();

	combinedContent += `\n\n---\n\n# ${sectionTitle}\n\n`;
	combinedContent += content.trim() + '\n';
});

fs.writeFileSync(OUTPUT_FILE, combinedContent, 'utf8');
console.log(`✅ Combined ${files.length} markdown files into README.md`);
