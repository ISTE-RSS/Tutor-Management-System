import React from 'react';
import { Box, LinearProgress } from '@material-ui/core';
import { makeStyles, createStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() =>
  createStyles({
    progress: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 8,
    },
  })
);

function LoadingPage(): JSX.Element {
  const classes = useStyles();

  return (
    <Box position='relative'>
      <LinearProgress color='secondary' className={classes.progress} />
    </Box>
  );
}

export default LoadingPage;
