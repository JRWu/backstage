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

import { useEntity } from '@backstage/plugin-catalog-react';
import { useState, useMemo } from 'react';
import { Select, SelectedItems } from '@backstage/core-components';
import { OpenApiDefinition } from './OpenApiDefinition';
import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  versionSelector: {
    maxWidth: 300,
    '& .MuiInputBase-root': {
      borderRadius: theme.spacing(1),
    },
    '& .MuiOutlinedInput-root': {
      borderRadius: theme.spacing(1),
    },
  },
}));

const VERSIONS_ANNOTATION = 'api-docs.backstage.io/versions';
const DEFAULT_VERSION_ANNOTATION = 'api-docs.backstage.io/default-version';

/** @public */
export type OpenApiDefinitionWidgetWithVersionsProps = {
  definition: string;
  requestInterceptor?: (req: any) => any | Promise<any>;
  supportedSubmitMethods?: string[];
};

/** @public */
export const OpenApiDefinitionWidgetWithVersions = (
  props: OpenApiDefinitionWidgetWithVersionsProps,
) => {
  const { definition, ...swaggerUiProps } = props;
  const classes = useStyles();
  const { entity } = useEntity();

  const { versions, defaultVersion } = useMemo(() => {
    const annotations = entity.metadata?.annotations || {};
    const versionsAnnotation = annotations[VERSIONS_ANNOTATION];
    const defaultVersionAnnotation = annotations[DEFAULT_VERSION_ANNOTATION];

    let parsedVersions: Record<string, string> = {};

    if (versionsAnnotation) {
      try {
        parsedVersions = JSON.parse(versionsAnnotation);
      } catch {
        parsedVersions = {};
      }
    }

    if (Object.keys(parsedVersions).length === 0) {
      return { versions: null, defaultVersion: null };
    }

    const defaultVer =
      defaultVersionAnnotation || Object.keys(parsedVersions)[0];
    return { versions: parsedVersions, defaultVersion: defaultVer };
  }, [entity]);

  const [selectedVersion, setSelectedVersion] = useState<string>(
    defaultVersion || '',
  );

  const currentDefinition = useMemo(() => {
    if (!versions || !selectedVersion) {
      return definition;
    }
    return versions[selectedVersion] || definition;
  }, [versions, selectedVersion, definition]);

  const versionItems = useMemo(() => {
    if (!versions) {
      return [];
    }
    return Object.keys(versions).map(version => ({
      label: version,
      value: version,
    }));
  }, [versions]);

  return (
    <Box className={classes.container}>
      {versions && versionItems.length > 0 && (
        <Box className={classes.versionSelector}>
          <Select
            label="Version"
            items={versionItems}
            selected={selectedVersion}
            onChange={(value: SelectedItems) =>
              setSelectedVersion(value as string)
            }
          />
        </Box>
      )}
      <OpenApiDefinition definition={currentDefinition} {...swaggerUiProps} />
    </Box>
  );
};
