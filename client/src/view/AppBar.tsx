import {
  AppBar as MuiAppBar,
  Button,
  ButtonGroup,
  IconButton,
  PaletteType,
  Popover,
  Theme,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
} from '@material-ui/core';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import {
  Brightness5 as LightIcon,
  Brightness7 as DarkIcon,
  Download as DownloadIcon,
  Github as GitHubIcon,
  Menu as MenuIcon,
} from 'mdi-material-ui';
import { useSnackbar } from 'notistack';
import React, { useMemo, useState } from 'react';
import { useRouteMatch } from 'react-router';
import { TutorialInEntity } from '../../../server/src/shared/model/Common';
import { useChangeTheme } from '../components/ContextWrapper';
import SubmitButton from '../components/loading/SubmitButton';
import { getTutorialXLSX } from '../hooks/fetching/Files';
import { useLogin } from '../hooks/LoginService';
import { Tutorial } from '../model/Tutorial';
import { ROUTES } from '../routes/Routing.routes';
import { saveBlob } from '../util/helperFunctions';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    appBar: {
      zIndex: theme.zIndex.drawer + 1,
    },
    grow: {
      flexGrow: 1,
    },
    menuButton: {
      marginLeft: -12,
      marginRight: 20,
    },
    iconButton: {
      color: 'inherit',
      marginLeft: theme.spacing(0),
    },
    logoutButton: {
      marginRight: theme.spacing(2),
    },
    loggedInAsArea: {
      display: 'flex',
      flexDirection: 'column',
      marginLeft: theme.spacing(2),
      marginRight: theme.spacing(1),
      textAlign: 'right',
    },
    popoverRoot: {
      margin: theme.spacing(2),
    },
  })
);

const TITLE_TEXTS: Map<string, string> = new Map(
  Object.values(ROUTES).map((route) => [route.template, route.title])
);

interface Props {
  onMenuButtonClicked: (ev: React.MouseEvent<HTMLButtonElement>) => void;
}

interface CreatingState {
  [tutorialSlot: string]: boolean | undefined;
}

function getTitleFromPath(path: string): string {
  const title = TITLE_TEXTS.get(path);

  return title ?? 'TITLE_NOT_FOUND';
}

function useTitleFromRoute(): string {
  const match = useRouteMatch();
  const title = useMemo(() => getTitleFromPath(match.path), [match.path]);

  return title;
}

function AppBar({ onMenuButtonClicked }: Props): JSX.Element {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const classes = useStyles();
  const theme = useTheme();
  const changeTheme = useChangeTheme();

  const { logout, isLoggedIn, userData } = useLogin();
  const userIsLoggedIn: boolean = isLoggedIn();

  const title = useTitleFromRoute();

  const [backupAnchor, setBackupAnchor] = useState<HTMLElement | undefined>(undefined);
  const [creatingXLSX, setCreatingXLSX] = useState<CreatingState>({});

  function handleThemeChangeClicked() {
    const newType: PaletteType = theme.palette.type === 'light' ? 'dark' : 'light';
    changeTheme(newType);
  }

  function handleLogBtnClicked() {
    logout().then(() => enqueueSnackbar('Erfolgreich ausgeloggt', { variant: 'success' }));
  }

  async function handleDownloadXLSX(tutorial: TutorialInEntity) {
    const snackId = enqueueSnackbar('Erstelle XLSX...', { variant: 'info', persist: true });
    setCreatingXLSX((state) => ({ ...state, [tutorial.slot]: true }));

    try {
      const blob = await getTutorialXLSX(tutorial.id);

      saveBlob(blob, `Tutorium_${tutorial.slot}.xlsx`);
    } catch {
      enqueueSnackbar('XLSX konnte nicht erstellt werden.', { variant: 'error' });
    } finally {
      setCreatingXLSX((state) => ({ ...state, [tutorial.slot]: false }));
      closeSnackbar(snackId || undefined);
    }
  }

  return (
    <MuiAppBar position='static' className={classes.appBar}>
      <Toolbar>
        <IconButton
          className={classes.menuButton}
          color='inherit'
          onClick={onMenuButtonClicked}
          aria-label='Menu'
          style={{ visibility: userIsLoggedIn ? 'visible' : 'hidden' }}
        >
          <MenuIcon />
        </IconButton>

        <Typography variant='h6' color='inherit' className={classes.grow}>
          {title}
        </Typography>

        {userIsLoggedIn && (
          <>
            <Button
              color='inherit'
              endIcon={<DownloadIcon />}
              onClick={(e) => setBackupAnchor(e.currentTarget)}
            >
              Backup
            </Button>

            <Popover
              open={!!backupAnchor}
              anchorEl={backupAnchor}
              onClose={() => setBackupAnchor(undefined)}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
              }}
            >
              {userData && (
                <ButtonGroup
                  className={classes.popoverRoot}
                  orientation='vertical'
                  color='default'
                  variant='text'
                >
                  {[...userData.tutorials, ...userData.tutorialsToCorrect].map((tutorial) => (
                    <SubmitButton
                      key={tutorial.slot}
                      onClick={() => handleDownloadXLSX(tutorial)}
                      isSubmitting={!!creatingXLSX[tutorial.slot]}
                    >
                      {Tutorial.getDisplayString(tutorial)}
                    </SubmitButton>
                  ))}
                </ButtonGroup>
              )}
            </Popover>

            <div className={classes.loggedInAsArea}>
              <Typography variant='caption' color='inherit'>
                Angemeldet als:
              </Typography>

              <Typography variant='caption' color='inherit'>
                {userData ? `${userData.firstname} ${userData.lastname}` : 'NOT_FOUND'}
              </Typography>
            </div>

            <Button color='inherit' onClick={handleLogBtnClicked} className={classes.logoutButton}>
              Abmelden
            </Button>
          </>
        )}

        <Tooltip title='Zwischen hellem & dunklem Design wechseln.'>
          <IconButton onClick={handleThemeChangeClicked} className={classes.iconButton}>
            {theme.palette.type === 'light' ? <LightIcon /> : <DarkIcon />}
          </IconButton>
        </Tooltip>

        <IconButton
          className={classes.iconButton}
          href='https://github.com/Dudrie/Tutor-Management-System/issues'
          target='_blank'
          rel='noopener noreferrer'
        >
          <GitHubIcon fontSize='default' />
        </IconButton>
      </Toolbar>
    </MuiAppBar>
  );
}

export default AppBar;
