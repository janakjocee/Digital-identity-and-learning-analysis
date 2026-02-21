#!/bin/bash
# LearnSync AI v1.0 - Backup Script
# Creates backups of database and important files

set -e

# Configuration
BACKUP_DIR="/backups/learnsync"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Starting backup at $(date)${NC}"

# Create backup directory
mkdir -p $BACKUP_DIR/{mongo,redis,uploads}

# Backup MongoDB
echo -e "${YELLOW}Backing up MongoDB...${NC}"
docker exec learnsync-mongo mongodump --out /data/backup/$DATE
docker cp learnsync-mongo:/data/backup/$DATE $BACKUP_DIR/mongo/
docker exec learnsync-mongo rm -rf /data/backup/$DATE

# Backup Redis
echo -e "${YELLOW}Backing up Redis...${NC}"
docker exec learnsync-redis redis-cli BGSAVE
sleep 5
docker cp learnsync-redis:/data/dump.rdb $BACKUP_DIR/redis/dump_$DATE.rdb

# Backup uploads
echo -e "${YELLOW}Backing up uploads...${NC}"
if [ -d "uploads" ]; then
    tar -czf $BACKUP_DIR/uploads/uploads_$DATE.tar.gz uploads/
fi

# Create archive
echo -e "${YELLOW}Creating archive...${NC}"
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz -C $BACKUP_DIR mongo/$DATE redis/dump_$DATE.rdb uploads/uploads_$DATE.tar.gz

# Clean up old backups
echo -e "${YELLOW}Cleaning up old backups...${NC}"
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR/mongo -maxdepth 1 -type d -mtime +$RETENTION_DAYS -exec rm -rf {} \;
find $BACKUP_DIR/redis -name "dump_*.rdb" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR/uploads -name "uploads_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo -e "${GREEN}Backup completed: $BACKUP_DIR/backup_$DATE.tar.gz${NC}"