/*
 * Copyright 2024 The Backstage Authors
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

import FormControl from '@material-ui/core/FormControl';
import IconButton from '@material-ui/core/IconButton';
import Input from '@material-ui/core/Input';
import InputAdornment from '@material-ui/core/InputAdornment';
import { makeStyles } from '@material-ui/core/styles';
import Clear from '@material-ui/icons/Clear';
import Search from '@material-ui/icons/Search';
import { useEffect, useMemo, useState } from 'react';
import useDebounce from 'react-use/lib/useDebounce';
import {
  useEntityList,
  EntityApiEndpointFilter,
} from '@backstage/plugin-catalog-react';

const useStyles = makeStyles(
  _theme => ({
    root: {
      marginBottom: 16,
    },
  }),
  { name: 'ApiEndpointSearchBar' },
);

export const ApiEndpointSearchBar = () => {
  const classes = useStyles();
  const {
    updateFilters,
    queryParameters: { endpoint: endpointParameter },
  } = useEntityList();

  const queryParamEndpointFilter = useMemo(
    () => [endpointParameter].flat()[0],
    [endpointParameter],
  );

  const [search, setSearch] = useState(queryParamEndpointFilter ?? '');

  useDebounce(
    () => {
      updateFilters({
        endpoint: search.length
          ? new EntityApiEndpointFilter(search)
          : undefined,
      } as any);
    },
    250,
    [search, updateFilters],
  );

  useEffect(() => {
    if (queryParamEndpointFilter) {
      setSearch(queryParamEndpointFilter);
    }
  }, [queryParamEndpointFilter]);

  return (
    <div className={classes.root}>
      <FormControl fullWidth>
        <Input
          aria-label="search endpoints"
          id="api-endpoint-search-input"
          placeholder="Search API endpoints (e.g. /api/catalog/refresh)"
          autoComplete="off"
          onChange={event => setSearch(event.target.value)}
          value={search}
          startAdornment={
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          }
          endAdornment={
            <InputAdornment position="end">
              <IconButton
                aria-label="clear endpoint search"
                onClick={() => setSearch('')}
                edge="end"
                disabled={search.length === 0}
              >
                <Clear />
              </IconButton>
            </InputAdornment>
          }
        />
      </FormControl>
    </div>
  );
};
