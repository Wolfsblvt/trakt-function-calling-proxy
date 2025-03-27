import { promises as fsPromises, createWriteStream } from 'node:fs';
import { get } from 'node:https';
import { join } from 'node:path';

const rootDir = process.cwd();

async function downloadTraktDocs() {
    try {
        const docsDir = join(rootDir, '.docs');
        const filePath = join(docsDir, 'trakt.apib');

        try {
            await fsPromises.stat(docsDir);
        } catch {
            await fsPromises.mkdir(docsDir);
        }

        const file = createWriteStream(filePath);
        await new Promise((resolve, reject) => {
            const req = get('https://trakt.docs.apiary.io/api-description-document', (res) => {
                res.pipe(file);
                resolve(res);
            });
            req.on('error', reject);
        });

        await new Promise((resolve, reject) => {
            file.on('finish', (/** @type {any} */ x) => resolve(x));
            file.on('error', reject);
        });

        file.close();
        console.log('Trakt API documentation downloaded successfully');
    } catch (err) {
        console.error('Error downloading Trakt API documentation:', err);
        process.exitCode = 1;
    }
}

await downloadTraktDocs();
