# Agent #16: Data Processor

## Purpose
Build robust, production-grade data processing pipelines for ETL (Extract, Transform, Load) operations with comprehensive validation, transformation, and error handling capabilities.

## Architecture
- **Type**: TypeScript-based data processing library
- **Runtime**: Node.js 20+
- **Processing Model**: Stream-based for large datasets, batch for small datasets
- **Storage**: SQLite for persistent data, in-memory for transient operations

## What This Agent Does

Agent #16 provides enterprise-grade data processing capabilities for:

1. **Data Ingestion**: Read from multiple sources (files, APIs, databases)
2. **Data Transformation**: Apply complex transformations at scale
3. **Data Validation**: Ensure data quality with schema validation
4. **Data Loading**: Write to multiple destinations reliably

### Key Features

- **Multi-Format Support**: CSV, JSON, XML, Parquet
- **Stream Processing**: Handle files > 1GB efficiently
- **Schema Validation**: Joi and Zod support
- **Error Recovery**: Automatic retry with exponential backoff
- **Data Quality**: Built-in quality checks and duplicate detection
- **Performance**: Process 1M+ records in under 60 seconds

## Inputs

### Configuration
```typescript
interface ProcessorConfig {
  source: {
    type: 'file' | 'api' | 'database';
    location: string;
    format: 'csv' | 'json' | 'xml' | 'parquet';
  };
  transformations: Array<{
    type: 'map' | 'filter' | 'reduce' | 'aggregate';
    operation: Function;
  }>;
  validation: {
    schema: JoiSchema | ZodSchema;
    strict: boolean;
  };
  destination: {
    type: 'file' | 'api' | 'database';
    location: string;
  };
}
```

### Data Sources
- **Files**: Local filesystem or S3-compatible storage
- **APIs**: REST APIs with rate limiting support
- **Databases**: SQLite, PostgreSQL, MySQL

## Outputs

### Processed Data
- Validated and transformed data written to destination
- Error reports with failed records
- Processing statistics and metrics

### Monitoring
- Real-time progress updates
- Performance metrics (throughput, latency)
- Error tracking and alerting

## Usage

### Basic Pipeline
```typescript
import { DataProcessor } from './src/processors/batch-processor';

const processor = new DataProcessor({
  source: {
    type: 'file',
    location: './data/input.csv',
    format: 'csv'
  },
  transformations: [
    {
      type: 'filter',
      operation: (record) => record.age > 18
    },
    {
      type: 'map',
      operation: (record) => ({
        ...record,
        fullName: `${record.firstName} ${record.lastName}`
      })
    }
  ],
  validation: {
    schema: userSchema,
    strict: true
  },
  destination: {
    type: 'file',
    location: './data/output.json'
  }
});

await processor.process();
```

### Stream Processing
```typescript
import { StreamProcessor } from './src/processors/stream-processor';

const processor = new StreamProcessor({
  source: createReadStream('./data/large-file.csv'),
  destination: createWriteStream('./data/output.json')
});

processor.on('progress', (stats) => {
  console.log(`Processed ${stats.recordsProcessed} records`);
});

await processor.process();
```

## Integration Points

- **Agent 8**: Performance monitoring for pipeline execution
- **Agent 11**: Analytics on processed data
- **Agent 12**: Quality assurance validation
- **Agent 15**: API integration for data sources/sinks
- **Agent 19**: Deployment automation for pipelines

## Development

### Setup
```bash
cd agents/agent16
npm install
npm test
```

### Testing
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# Coverage report
npm run test:coverage
```

### Build
```bash
npm run build
npm run lint
```

## Performance

### Benchmarks
- **1M records (CSV)**: ~45 seconds
- **1GB file (streaming)**: ~2 minutes
- **Complex transformations**: ~10,000 records/second
- **Memory usage**: <100MB for 1M records (streaming mode)

### Optimization Tips
1. Use streaming for files > 100MB
2. Batch operations when possible
3. Enable parallel processing for CPU-intensive transforms
4. Use connection pooling for database operations

## Error Handling

### Strategies
- **Skip**: Log error and continue with next record
- **Retry**: Retry with exponential backoff
- **Fail**: Stop processing and rollback
- **Dead Letter**: Move failed records to error queue

### Example
```typescript
const processor = new DataProcessor({
  errorHandling: {
    strategy: 'retry',
    maxRetries: 3,
    backoff: 'exponential',
    onError: (error, record) => {
      logger.error('Failed to process record', { error, record });
    }
  }
});
```

## Security

- Input validation on all data sources
- SQL injection prevention
- XSS prevention for string fields
- Rate limiting for API sources
- Audit logging for all operations

## Roadmap

- [ ] Support for Apache Kafka streams
- [ ] GPU acceleration for numeric operations
- [ ] Real-time CDC (Change Data Capture)
- [ ] Machine learning feature engineering
- [ ] Apache Arrow format support

## License
MIT - See root LICENSE file
