/*
 * Copyright 2025 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Alert from '@material-ui/lab/Alert';
import { CodeSnippet } from '@backstage/core-components';
import yaml from 'js-yaml';

const useStyles = makeStyles(theme => ({
  container: {
    padding: theme.spacing(2),
  },
  inputSection: {
    marginBottom: theme.spacing(3),
  },
  button: {
    marginTop: theme.spacing(2),
  },
  resultsSection: {
    marginTop: theme.spacing(3),
  },
  summarySection: {
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
  },
  specColumn: {
    height: '600px',
    overflow: 'auto',
  },
}));

export interface ApiDiffWidgetProps {
  currentDefinition: string;
}

interface DiffSummary {
  added: string[];
  removed: string[];
  modified: string[];
}

const analyzeDiff = (
  current: any,
  input: any,
  path: string = '',
): DiffSummary => {
  const summary: DiffSummary = { added: [], removed: [], modified: [] };

  const currentKeys = new Set(Object.keys(current || {}));
  const inputKeys = new Set(Object.keys(input || {}));

  for (const key of inputKeys) {
    const fullPath = path ? `${path}.${key}` : key;
    if (!currentKeys.has(key)) {
      summary.added.push(fullPath);
    } else if (
      typeof input[key] === 'object' &&
      input[key] !== null &&
      typeof current[key] === 'object' &&
      current[key] !== null &&
      !Array.isArray(input[key])
    ) {
      const nested = analyzeDiff(current[key], input[key], fullPath);
      summary.added.push(...nested.added);
      summary.removed.push(...nested.removed);
      summary.modified.push(...nested.modified);
    } else if (JSON.stringify(current[key]) !== JSON.stringify(input[key])) {
      summary.modified.push(fullPath);
    }
  }

  for (const key of currentKeys) {
    if (!inputKeys.has(key)) {
      const fullPath = path ? `${path}.${key}` : key;
      summary.removed.push(fullPath);
    }
  }

  return summary;
};

export const ApiDiffWidget = ({ currentDefinition }: ApiDiffWidgetProps) => {
  const classes = useStyles();
  const [inputJson, setInputJson] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<{
    current: any;
    input: any;
    summary: DiffSummary;
  } | null>(null);

  const handleGenerateDiff = () => {
    setError(null);
    setComparison(null);

    try {
      let inputSpec: any;
      let currentSpec: any;

      try {
        inputSpec = JSON.parse(inputJson);
      } catch {
        inputSpec = yaml.load(inputJson);
      }

      try {
        currentSpec = JSON.parse(currentDefinition);
      } catch {
        currentSpec = yaml.load(currentDefinition);
      }

      const summary = analyzeDiff(currentSpec, inputSpec);

      setComparison({
        current: currentSpec,
        input: inputSpec,
        summary,
      });
    } catch (err) {
      if (err instanceof yaml.YAMLException) {
        setError(
          'Invalid JSON/YAML format. Please check your input and try again.',
        );
      } else {
        setError(
          `Error generating diff: ${
            err instanceof Error ? err.message : 'Unknown error'
          }`,
        );
      }
    }
  };

  return (
    <div className={classes.container}>
      <div className={classes.inputSection}>
        <Typography variant="h6" gutterBottom>
          Compare with JSON Specification
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          Paste a raw JSON or YAML OpenAPI specification below to compare it
          with the current API definition.
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={15}
          variant="outlined"
          placeholder='{"openapi": "3.0.0", ...}'
          value={inputJson}
          onChange={e => setInputJson(e.target.value)}
          error={!!error}
          helperText={error}
        />
        <Button
          className={classes.button}
          variant="contained"
          color="primary"
          onClick={handleGenerateDiff}
          disabled={!inputJson.trim()}
        >
          Generate Diff
        </Button>
      </div>

      {comparison && (
        <div className={classes.resultsSection}>
          <Typography variant="h6" gutterBottom>
            Comparison Results
          </Typography>

          <Box className={classes.summarySection}>
            <Typography variant="subtitle1" gutterBottom>
              Changes Summary:
            </Typography>
            {comparison.summary.added.length > 0 && (
              <Typography variant="body2" color="primary">
                ✅ Added ({comparison.summary.added.length}):{' '}
                {comparison.summary.added.slice(0, 5).join(', ')}
                {comparison.summary.added.length > 5 && '...'}
              </Typography>
            )}
            {comparison.summary.modified.length > 0 && (
              <Typography variant="body2" style={{ color: '#ff9800' }}>
                ⚠️ Modified ({comparison.summary.modified.length}):{' '}
                {comparison.summary.modified.slice(0, 5).join(', ')}
                {comparison.summary.modified.length > 5 && '...'}
              </Typography>
            )}
            {comparison.summary.removed.length > 0 && (
              <Typography variant="body2" color="error">
                ❌ Removed ({comparison.summary.removed.length}):{' '}
                {comparison.summary.removed.slice(0, 5).join(', ')}
                {comparison.summary.removed.length > 5 && '...'}
              </Typography>
            )}
            {comparison.summary.added.length === 0 &&
              comparison.summary.modified.length === 0 &&
              comparison.summary.removed.length === 0 && (
                <Typography variant="body2">
                  No changes detected - specifications are identical.
                </Typography>
              )}
          </Box>

          <Typography variant="subtitle1" gutterBottom>
            Side-by-Side Comparison:
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="subtitle2" gutterBottom>
                Current Specification
              </Typography>
              <div className={classes.specColumn}>
                <CodeSnippet
                  text={JSON.stringify(comparison.current, null, 2)}
                  language="json"
                  showCopyCodeButton
                />
              </div>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" gutterBottom>
                Provided Specification
              </Typography>
              <div className={classes.specColumn}>
                <CodeSnippet
                  text={JSON.stringify(comparison.input, null, 2)}
                  language="json"
                  showCopyCodeButton
                />
              </div>
            </Grid>
          </Grid>
        </div>
      )}

      {!comparison && !error && inputJson.trim() && (
        <Alert severity="info">
          Click "Generate Diff" to compare the specifications.
        </Alert>
      )}
    </div>
  );
};
