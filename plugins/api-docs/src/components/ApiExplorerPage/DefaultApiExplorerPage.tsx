/*
 * Copyright 2021 The Backstage Authors
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

import {
  Content,
  ContentHeader,
  CreateButton,
  PageWithHeader,
  SupportButton,
  TableColumn,
  TableProps,
} from '@backstage/core-components';
import { configApiRef, useApi, useRouteRef } from '@backstage/core-plugin-api';
import { CatalogTable, CatalogTableRow } from '@backstage/plugin-catalog';
import {
  EntityKindPicker,
  EntityLifecyclePicker,
  EntityListProvider,
  EntityListPagination,
  EntityOwnerPicker,
  EntityTagPicker,
  EntityTypePicker,
  UserListFilterKind,
  UserListPicker,
  CatalogFilterLayout,
  EntityOwnerPickerProps,
  useEntityList,
} from '@backstage/plugin-catalog-react';
import { registerComponentRouteRef } from '../../routes';
import { usePermission } from '@backstage/plugin-permission-react';
import { catalogEntityCreatePermission } from '@backstage/plugin-catalog-common/alpha';
import { useTranslationRef } from '@backstage/frontend-plugin-api';
import { apiDocsTranslationRef } from '../../translation';
import { ApiEndpointSearchBar } from '../ApiEndpointSearchBar';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import yaml from 'yaml';

const useStyles = makeStyles(
  theme => ({
    endpointBox: {
      border: `2px solid ${theme.palette.error.main}`,
      backgroundColor: theme.palette.background.paper,
      padding: theme.spacing(2),
      margin: theme.spacing(2),
      borderRadius: theme.shape.borderRadius,
    },
    endpointPath: {
      fontWeight: 'bold',
      marginBottom: theme.spacing(1),
    },
  }),
  { name: 'DefaultApiExplorerPage' },
);

function extractMatchedEndpoints(
  definition: string,
  searchQuery: string,
): Array<{ path: string; method: string; description: string }> {
  try {
    let spec: any;
    try {
      spec = JSON.parse(definition);
    } catch {
      spec = yaml.parse(definition);
    }

    if (!spec?.paths) {
      return [];
    }

    const searchLower = searchQuery.toLowerCase();
    const matchedEndpoints: Array<{
      path: string;
      method: string;
      description: string;
    }> = [];

    for (const [path, methods] of Object.entries(spec.paths)) {
      if (path.toLowerCase().includes(searchLower)) {
        for (const [method, details] of Object.entries(methods as any)) {
          if (
            typeof details === 'object' &&
            details !== null &&
            ((details as any).description || (details as any).summary)
          ) {
            matchedEndpoints.push({
              path,
              method: method.toUpperCase(),
              description:
                (details as any).description || (details as any).summary || '',
            });
            break;
          }
        }
      }
    }

    return matchedEndpoints;
  } catch {
    return [];
  }
}

const defaultColumns: TableColumn<CatalogTableRow>[] = [
  CatalogTable.columns.createTitleColumn({ hidden: true }),
  CatalogTable.columns.createNameColumn({ defaultKind: 'API' }),
  CatalogTable.columns.createSystemColumn(),
  CatalogTable.columns.createOwnerColumn(),
  CatalogTable.columns.createSpecTypeColumn(),
  CatalogTable.columns.createSpecLifecycleColumn(),
  CatalogTable.columns.createMetadataDescriptionColumn(),
  CatalogTable.columns.createTagsColumn(),
];
const CatalogTableWithEndpointDetails = (props: {
  columns: TableColumn<CatalogTableRow>[];
  actions?: TableProps<CatalogTableRow>['actions'];
}) => {
  const classes = useStyles();
  const { filters } = useEntityList();
  const endpointFilter = (filters as any).endpoint;
  const searchQuery = endpointFilter?.value;

  const detailPanel = ({ rowData }: { rowData: CatalogTableRow }) => {
    if (!searchQuery) return null;

    const entity = rowData.entity;
    if (entity.kind !== 'API') return null;

    const definition = entity.spec?.definition;
    if (!definition || typeof definition !== 'string') return null;

    const matchedEndpoints = extractMatchedEndpoints(definition, searchQuery);
    if (matchedEndpoints.length === 0) return null;

    return (
      <Box className={classes.endpointBox}>
        {matchedEndpoints.map((endpoint, idx) => (
          <Box key={idx} mb={idx < matchedEndpoints.length - 1 ? 2 : 0}>
            <Typography className={classes.endpointPath}>
              {endpoint.path}
            </Typography>
            <Typography variant="body2">
              Description: {endpoint.description}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <CatalogTable
      columns={props.columns}
      actions={props.actions}
      detailPanel={detailPanel}
    />
  );
};

/**
 * DefaultApiExplorerPageProps
 * @public
 */
export type DefaultApiExplorerPageProps = {
  initiallySelectedFilter?: UserListFilterKind;
  columns?: TableColumn<CatalogTableRow>[];
  actions?: TableProps<CatalogTableRow>['actions'];
  ownerPickerMode?: EntityOwnerPickerProps['mode'];
  pagination?: EntityListPagination;
};

/**
 * DefaultApiExplorerPage
 * @public
 */
export const DefaultApiExplorerPage = (props: DefaultApiExplorerPageProps) => {
  const {
    initiallySelectedFilter = 'all',
    columns,
    actions,
    ownerPickerMode,
    pagination,
  } = props;

  const configApi = useApi(configApiRef);
  const { t } = useTranslationRef(apiDocsTranslationRef);
  const generatedSubtitle = t('defaultApiExplorerPage.subtitle', {
    orgName: configApi.getOptionalString('organization.name') ?? 'Backstage',
  });
  const registerComponentLink = useRouteRef(registerComponentRouteRef);
  const { allowed } = usePermission({
    permission: catalogEntityCreatePermission,
  });

  return (
    <PageWithHeader
      themeId="apis"
      title={t('defaultApiExplorerPage.title')}
      subtitle={generatedSubtitle}
      pageTitleOverride={t('defaultApiExplorerPage.pageTitleOverride')}
    >
      <Content>
        <ContentHeader title="">
          {allowed && (
            <CreateButton
              title={t('defaultApiExplorerPage.createButtonTitle')}
              to={registerComponentLink?.()}
            />
          )}
          <SupportButton>
            {t('defaultApiExplorerPage.supportButtonTitle')}
          </SupportButton>
        </ContentHeader>
        <EntityListProvider pagination={pagination}>
          <CatalogFilterLayout>
            <CatalogFilterLayout.Filters>
              <EntityKindPicker initialFilter="api" hidden />
              <EntityTypePicker />
              <UserListPicker initialFilter={initiallySelectedFilter} />
              <EntityOwnerPicker mode={ownerPickerMode} />
              <EntityLifecyclePicker />
              <EntityTagPicker />
            </CatalogFilterLayout.Filters>
            <CatalogFilterLayout.Content>
              <ApiEndpointSearchBar />
              <CatalogTableWithEndpointDetails
                columns={columns || defaultColumns}
                actions={actions}
              />
            </CatalogFilterLayout.Content>
          </CatalogFilterLayout>
        </EntityListProvider>
      </Content>
    </PageWithHeader>
  );
};
