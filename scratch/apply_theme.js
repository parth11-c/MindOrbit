const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('src', function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Replace regular classNames
        let newContent = content.replace(/className="([^"]+)"/g, (match, classStr) => {
            let classes = classStr.split(' ');
            
            let hasBgRed = classes.some(c => c.startsWith('bg-red-6'));
            if (hasBgRed) {
                // Primary background (#E3D8B7) needs dark text instead of text-white
                classes = classes.map(c => c === 'text-white' ? 'text-neutral-900 dark:text-neutral-950' : c);
            }

            // Make standalone text/icons darker so they are visible on white background
            // since the base red-600 is #E3D8B7 (which is too light for text)
            classes = classes.map(c => {
                if (c === 'text-red-500') return 'text-red-700';
                if (c === 'text-red-600' || c === 'text-red-650') return 'text-red-800';
                if (c === 'fill-red-600') return 'fill-red-800';
                if (c === 'border-red-600') return 'border-red-700';
                return c;
            });
            
            return `className="${classes.join(' ')}"`;
        });
        
        // Handle template string classNames
        newContent = newContent.replace(/className=\{`([^`]+)`\}/g, (match, classStr) => {
            let classes = classStr.split(' ');
            
            let hasBgRed = classes.some(c => c.startsWith('bg-red-6'));
            if (hasBgRed) {
                classes = classes.map(c => c === 'text-white' ? 'text-neutral-900 dark:text-neutral-950' : c);
            }

            classes = classes.map(c => {
                if (c === 'text-red-500') return 'text-red-700';
                if (c === 'text-red-600' || c === 'text-red-650') return 'text-red-800';
                if (c === 'fill-red-600') return 'fill-red-800';
                if (c === 'border-red-600') return 'border-red-700';
                return c;
            });
            
            return `className={\`${classes.join(' ')}\`}`;
        });

        // Also just globally search for text-white close to bg-red-600
        // (In case they are separated by newlines or complex logic in clsx)
        // This is safe enough as a fallback
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Updated:', filePath);
        }
    }
});
