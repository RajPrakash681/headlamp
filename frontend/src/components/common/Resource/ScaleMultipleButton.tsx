/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Icon } from '@iconify/react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Fab from '@mui/material/Fab';
import Grid from '@mui/material/Grid';
import OutlinedInput from '@mui/material/OutlinedInput';
import { styled, useTheme } from '@mui/material/styles';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import Deployment from '../../../lib/k8s/deployment';
import { KubeObject } from '../../../lib/k8s/KubeObject';
import ReplicaSet from '../../../lib/k8s/replicaSet';
import StatefulSet from '../../../lib/k8s/statefulSet';
import { clusterAction } from '../../../redux/clusterActionSlice';
import {
  EventStatus,
  HeadlampEventType,
  useEventCallback,
} from '../../../redux/headlampEventSlice';
import { AppDispatch } from '../../../redux/stores/store';
import ActionButton, { ButtonStyle } from '../ActionButton';
import { LightTooltip } from '../Tooltip';

export type ScalableResource = Deployment | StatefulSet | ReplicaSet;

export function isScalableResource(item: KubeObject): item is ScalableResource {
  return item instanceof Deployment || item instanceof StatefulSet || item instanceof ReplicaSet;
}

interface ScaleMultipleButtonProps {
  items: ScalableResource[];
  buttonStyle?: ButtonStyle;
  afterConfirm?: () => void;
}

const Input = styled(OutlinedInput)({
  '& input[type=number]': {
    MozAppearance: 'textfield',
    textAlign: 'center',
  },
  '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
    display: 'none',
  },
  width: '80px',
});

export default function ScaleMultipleButton(props: ScaleMultipleButtonProps) {
  const dispatch: AppDispatch = useDispatch();
  const { items, buttonStyle, afterConfirm } = props;
  const [openDialog, setOpenDialog] = React.useState(false);
  const [numReplicas, setNumReplicas] = React.useState<number>(0);
  const { t } = useTranslation(['translation']);
  const location = useLocation();
  const theme = useTheme();
  const dispatchScaleEvent = useEventCallback(HeadlampEventType.SCALE_RESOURCES);
  const numReplicasForWarning = 100;
  const desiredNumReplicasLabel = 'desired-number-replicas-label';

  async function scaleResources() {
    return Promise.all(items.map(item => item.scale(numReplicas)));
  }

  function handleSave() {
    const itemsLength = items.length;

    dispatch(
      clusterAction(() => scaleResources(), {
        startMessage: t('Scaling {{ itemsLength }} items…', { itemsLength }),
        cancelledMessage: t('Cancelled scaling {{ itemsLength }} items.', { itemsLength }),
        successMessage: t('Scaled {{ itemsLength }} items.', { itemsLength }),
        errorMessage: t('Failed to scale {{ itemsLength }} items.', { itemsLength }),
        cancelUrl: location.pathname,
        startUrl: location.pathname,
        errorUrl: location.pathname,
      })
    );
  }

  function handleOpen() {
    // Initialise to the replica count of the first item so the user has a sensible starting value.
    const first = items[0];
    const current =
      first && 'spec' in first && first.spec?.replicas !== undefined
        ? parseInt(first.spec.replicas)
        : 0;
    setNumReplicas(isNaN(current) ? 0 : current);
    setOpenDialog(true);
  }

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <>
      <ActionButton
        description={t('translation|Scale items')}
        buttonStyle={buttonStyle}
        onClick={handleOpen}
        icon="mdi:expand-all"
      />
      {openDialog && (
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
          <DialogTitle>{t('translation|Scale items')}</DialogTitle>
          <DialogContent
            sx={{
              paddingBottom: '30px',
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <DialogContentText>
                  {t('Are you sure you want to scale the following items?')}
                  <ul>
                    {items.map(item => (
                      <li key={item.metadata.uid}>{item.metadata.name}</li>
                    ))}
                  </ul>
                </DialogContentText>
              </Grid>
              <Grid item container alignItems="center" spacing={1}>
                <Grid item sm="auto" xs={12}>
                  <DialogContentText id={desiredNumReplicasLabel}>
                    {t('translation|Desired number of replicas:')}
                  </DialogContentText>
                </Grid>
                <Grid item spacing={2} sm="auto" sx={{ padding: '6px', textAlign: 'left' }}>
                  <Fab
                    size="small"
                    color="secondary"
                    onClick={() => setNumReplicas(n => Math.max(0, n - 1))}
                    aria-label={t('translation|Decrement')}
                    disabled={numReplicas <= 0}
                    sx={{ boxShadow: 'none' }}
                  >
                    <Icon icon="mdi:minus" width="22px" />
                  </Fab>
                  <Input
                    size="small"
                    type="number"
                    value={numReplicas}
                    sx={{ marginLeft: '6px', marginRight: '6px' }}
                    onChange={e => setNumReplicas(Math.max(0, Number(e.target.value)))}
                    aria-labelledby={desiredNumReplicasLabel}
                    inputProps={{
                      min: 0,
                      step: 1,
                    }}
                  />
                  <Fab
                    size="small"
                    color="secondary"
                    onClick={() => setNumReplicas(n => n + 1)}
                    aria-label={t('translation|Increment')}
                    sx={{ boxShadow: 'none' }}
                  >
                    <Icon icon="mdi:plus" width="22px" />
                  </Fab>
                </Grid>
                <Grid item xs="auto">
                  {numReplicas >= numReplicasForWarning && (
                    <LightTooltip
                      title={t(
                        "A large number of replicas may negatively impact the cluster's performance"
                      )}
                    >
                      <Icon icon="mdi:warning" width="28px" color={theme.palette.warning.main} />
                    </LightTooltip>
                  )}
                </Grid>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)} color="secondary" variant="contained">
              {t('translation|Cancel')}
            </Button>
            <Button
              onClick={() => {
                setOpenDialog(false);
                handleSave();
                dispatchScaleEvent({
                  resources: items,
                  numReplicas,
                  status: EventStatus.CONFIRMED,
                });
                if (afterConfirm) {
                  afterConfirm();
                }
              }}
              variant="contained"
              color="primary"
            >
              {t('translation|Apply')}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}
