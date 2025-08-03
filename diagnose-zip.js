#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function diagnoseZip(zipPath) {
  console.log(`🔍 Diagnosi file ZIP: ${zipPath}\n`);
  
  // Verifica esistenza file
  if (!fs.existsSync(zipPath)) {
    console.error('❌ File non trovato');
    return false;
  }
  
  const stats = fs.statSync(zipPath);
  console.log(`📊 Dimensione file: ${stats.size} bytes`);
  console.log(`📅 Ultima modifica: ${stats.mtime}`);
  
  // Verifica se è un file ZIP valido
  try {
    const fileList = execSync(`unzip -l "${zipPath}"`, { encoding: 'utf8' });
    console.log('\n📦 Contenuto ZIP:');
    console.log(fileList);
    
    // Prova a estrarre
    const tempDir = `temp-extract-${Date.now()}`;
    fs.mkdirSync(tempDir, { recursive: true });
    
    try {
      execSync(`unzip -j "${zipPath}" -d "${tempDir}/"`, { stdio: 'inherit' });
      console.log('\n✅ Estrazione riuscita!');
      
      const extractedFiles = fs.readdirSync(tempDir);
      console.log('📁 File estratti:', extractedFiles);
      
      // Verifica file importanti
      if (extractedFiles.includes('index.html')) {
        console.log('✅ index.html trovato');
        const htmlContent = fs.readFileSync(path.join(tempDir, 'index.html'), 'utf8');
        console.log('📄 Dimensione HTML:', htmlContent.length, 'caratteri');
      } else {
        console.log('❌ index.html mancante');
      }
      
      if (extractedFiles.includes('aideas.json')) {
        console.log('✅ aideas.json trovato');
        try {
          const manifest = JSON.parse(fs.readFileSync(path.join(tempDir, 'aideas.json'), 'utf8'));
          console.log('📝 Manifest valido:', manifest.name);
        } catch (e) {
          console.log('❌ aideas.json non valido:', e.message);
        }
      } else {
        console.log('ℹ️ aideas.json mancante (verrà creato automaticamente)');
      }
      
      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
      
    } catch (extractError) {
      console.error('❌ Errore estrazione:', extractError.message);
      return false;
    }
    
  } catch (listError) {
    console.error('❌ File non è un ZIP valido:', listError.message);
    return false;
  }
  
  return true;
}

// Uso dello script
const zipPath = process.argv[2];
if (!zipPath) {
  console.log('Uso: node diagnose-zip.js <percorso-file-zip>');
  console.log('Esempio: node diagnose-zip.js ./test-app.zip');
  process.exit(1);
}

const isValid = diagnoseZip(zipPath);
console.log(`\n🎯 Risultato: ${isValid ? '✅ ZIP valido' : '❌ ZIP non valido'}`); 