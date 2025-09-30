/*
 * Copyright 2020 The Backstage Authors
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

import { ApiEntity } from '@backstage/catalog-model';
import { OpenApiDefinitionWidget } from '@backstage/plugin-api-docs';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import { makeStyles } from '@material-ui/core/styles';
import { useState } from 'react';

const useStyles = makeStyles(theme => ({
  formControl: {
    margin: theme.spacing(2, 0),
    minWidth: 200,
  },
}));

interface VersionedOpenApiWidgetProps {
  definition: string;
  entity: ApiEntity;
}

export const VersionedOpenApiWidget = ({
  definition,
  entity,
}: VersionedOpenApiWidgetProps) => {
  const classes = useStyles();

  const versionsJson =
    entity.metadata.annotations?.['api-docs.backstage.io/versions'];
  let versions: Record<string, string> = {};

  try {
    if (versionsJson) {
      versions = JSON.parse(versionsJson);
    }
  } catch {
    // Ignore JSON parse errors and fallback to empty versions object
  }

  const defaultVersion =
    entity.metadata.annotations?.['api-docs.backstage.io/default-version'] ||
    Object.keys(versions)[0];

  const [selectedVersion, setSelectedVersion] = useState(
    defaultVersion || 'default',
  );

  const selectedDefinition = versions[selectedVersion] || definition;

  const showVersionSelector = Object.keys(versions).length > 1;

  return (
    <>
      {showVersionSelector && (
        <FormControl className={classes.formControl}>
          <InputLabel id="api-version-select-label">Version</InputLabel>
          <Select
            labelId="api-version-select-label"
            id="api-version-select"
            value={selectedVersion}
            onChange={e => setSelectedVersion(e.target.value as string)}
          >
            {Object.keys(versions).map(version => (
              <MenuItem key={version} value={version}>
                {version}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      <OpenApiDefinitionWidget definition={selectedDefinition} />
    </>
  );
};
