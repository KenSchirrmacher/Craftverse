# Backup System Documentation

## Overview
The backup system provides automated and manual backup functionality for the Minecraft server, ensuring data safety and recovery capabilities.

## Features
- Automated hourly backups
- Manual backup creation
- Backup restoration
- Backup cleanup and retention
- Error handling and recovery
- Concurrent backup prevention
- Backup manifest tracking

## Configuration
The backup system can be configured with the following options:
```javascript
{
  backupDir: string,        // Directory to store backups
  maxBackups: number,       // Maximum number of backups to retain (default: 10)
  backupInterval: number,   // Interval between automated backups in milliseconds (default: 3600000 - 1 hour)
  maxErrors: number,        // Maximum number of errors before system disable (default: 3)
  recoveryDelay: number     // Delay between retry attempts in milliseconds (default: 5000)
}
```

## Usage

### Automated Backups
Automated backups run every hour by default. The system will:
1. Create a backup of world data, player data, and configuration
2. Generate a backup manifest
3. Clean up old backups if exceeding maxBackups limit
4. Handle errors with exponential backoff

### Manual Backups
To create a manual backup:
```javascript
const backupId = await backupSystem.createBackup({
  type: 'manual',
  description: 'Manual backup description'
});
```

### Backup Restoration
To restore from a backup:
```javascript
await backupSystem.restoreBackup(backupId);
```

### Listing Backups
To list all available backups:
```javascript
const backups = await backupSystem.listBackups();
```

## Backup Contents
Each backup includes:
- World data (blocks, structures, etc.)
- Player data (inventories, positions, etc.)
- Configuration files
- Backup manifest with metadata

## Error Handling
The system implements:
- Exponential backoff for retries
- Maximum error threshold (3) before system disable
- Automatic error recovery
- Failed backup cleanup
- Error tracking in backup manifest

## Maintenance
- Old backups are automatically cleaned up
- Backup manifest tracks metadata for each backup
- Concurrent backups are prevented
- Scheduler can be controlled (start/stop/update interval)

## Security Considerations
- Backup files are stored in a secure location
- Backup manifest tracks all operations
- Failed backups are properly cleaned up
- Error handling prevents system overload

## Recovery Procedures
1. In case of data loss:
   - List available backups: `backupSystem.listBackups()`
   - Select appropriate backup
   - Restore using: `backupSystem.restoreBackup(backupId)`
2. In case of system errors:
   - System will automatically retry with exponential backoff
   - After 3 consecutive errors, system will disable
   - Manual intervention required to re-enable system

## Monitoring
The system provides:
- Backup status tracking
- Error logging
- Operation timestamps
- Backup size tracking
- Success/failure statistics

## Best Practices
1. Regular monitoring of backup status
2. Periodic testing of backup restoration
3. Monitoring of backup storage space
4. Regular review of error logs
5. Keeping backup system up to date 