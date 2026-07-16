const fs = require('fs');
let content = fs.readFileSync('src/components/Settings.tsx', 'utf8');

const targetStr = `const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setInstLogo(dataUrl);
          }
        };
        img.src = event.target?.result as string;`;

const replacementStr = `const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setInstLogo(dataUrl);
            // Auto-save the logo to institution
            onSaveInstitution({
              ...institution,
              logoUrl: dataUrl
            });
            triggerSuccess('Logo berhasil diunggah dan disimpan!');
          }
        };
        img.src = event.target?.result as string;`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync('src/components/Settings.tsx', content);
console.log('Settings logo autosave done');
