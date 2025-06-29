#!/bin/bash

# Script per sincronizzare automaticamente i cambiamenti con Git
# Uso: ./git-sync.sh "Messaggio del commit"

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Sincronizzazione Git in corso...${NC}"

# Controlla se è stato fornito un messaggio di commit
if [ -z "$1" ]; then
    echo -e "${RED}❌ Errore: Fornisci un messaggio di commit${NC}"
    echo "Uso: ./git-sync.sh \"Messaggio del commit\""
    exit 1
fi

COMMIT_MESSAGE="$1"

# Controlla lo stato del repository
echo -e "${YELLOW}📊 Controllo stato repository...${NC}"
git status --porcelain

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Errore: Non sei in un repository Git${NC}"
    exit 1
fi

# Aggiungi tutti i cambiamenti
echo -e "${YELLOW}📁 Aggiunta file modificati...${NC}"
git add .

# Crea il commit
echo -e "${YELLOW}💾 Creazione commit...${NC}"
git commit -m "$COMMIT_MESSAGE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Commit creato con successo!${NC}"
else
    echo -e "${RED}❌ Errore nella creazione del commit${NC}"
    exit 1
fi

# Push al repository remoto
echo -e "${YELLOW}🚀 Push al repository remoto...${NC}"
git push origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Push completato con successo!${NC}"
    echo -e "${GREEN}🎉 Repository sincronizzato!${NC}"
else
    echo -e "${RED}❌ Errore nel push al repository remoto${NC}"
    exit 1
fi 