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
import Alert from '@material-ui/lab/Alert';
import { CodeSnippet } from '@backstage/core-components';
import {
  compareSpecs,
  groupDiffsByEndpoint,
  getOperationsChanged,
} from '@useoptic/openapi-utilities';

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
}));

export interface ApiDiffWidgetProps {
  currentDefinition: string;
}

export const ApiDiffWidget = ({ currentDefinition }: ApiDiffWidgetProps) => {
  const classes = useStyles();
  const [inputJson, setInputJson] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [diffResult, setDiffResult] = useState<any>(null);

  const handleGenerateDiff = async () => {
    setError(null);
    setDiffResult(null);

    try {
      const inputSpec = JSON.parse(inputJson);
      const currentSpec = JSON.parse(currentDefinition);

      const comparison = await compareSpecs(currentSpec, inputSpec, {});
      const groupedDiffs = groupDiffsByEndpoint(comparison);
      const operationsChanged = getOperationsChanged(groupedDiffs);

      setDiffResult({
        comparison,
        groupedDiffs,
        operationsChanged,
      });
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format. Please check your input and try again.');
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
          Paste a raw JSON OpenAPI specification below to compare it with the
          current API definition.
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

      {diffResult && (
        <div className={classes.resultsSection}>
          <Typography variant="h6" gutterBottom>
            Comparison Results
          </Typography>

          <Box className={classes.summarySection}>
            <Typography variant="subtitle1" gutterBottom>
              Operations Changed:
            </Typography>
            {diffResult.operationsChanged.added.size > 0 && (
              <Typography variant="body2" color="primary">
                ✅ Added:{' '}
                {Array.from(diffResult.operationsChanged.added).join(', ')}
              </Typography>
            )}
            {diffResult.operationsChanged.changed.size > 0 && (
              <Typography variant="body2" style={{ color: '#ff9800' }}>
                ⚠️ Changed:{' '}
                {Array.from(diffResult.operationsChanged.changed).join(', ')}
              </Typography>
            )}
            {diffResult.operationsChanged.removed.size > 0 && (
              <Typography variant="body2" color="error">
                ❌ Removed:{' '}
                {Array.from(diffResult.operationsChanged.removed).join(', ')}
              </Typography>
            )}
            {diffResult.operationsChanged.added.size === 0 &&
              diffResult.operationsChanged.changed.size === 0 &&
              diffResult.operationsChanged.removed.size === 0 && (
                <Typography variant="body2">
                  No operation changes detected.
                </Typography>
              )}
          </Box>

          <Typography variant="subtitle1" gutterBottom>
            Detailed Diff:
          </Typography>
          <CodeSnippet
            text={JSON.stringify(diffResult.groupedDiffs, null, 2)}
            language="json"
            showCopyCodeButton
          />
        </div>
      )}

      {!diffResult && !error && inputJson.trim() && (
        <Alert severity="info">
          Click "Generate Diff" to compare the specifications.
        </Alert>
      )}
    </div>
  );
};
