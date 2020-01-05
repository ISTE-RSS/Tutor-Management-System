import { Button, Typography } from '@material-ui/core';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import clsx from 'clsx';
import { Formik, useFormikContext } from 'formik';
import React, { useEffect, useState } from 'react';
import { Prompt } from 'react-router';
import { Exercise, Sheet } from 'shared/dist/model/Sheet';
import { Team } from 'shared/dist/model/Team';
import FormikDebugDisplay from '../../../../components/forms/components/FormikDebugDisplay';
import SubmitButton from '../../../../components/forms/components/SubmitButton';
import { useDialog } from '../../../../hooks/DialogService';
import {
  generateInitialValues,
  PointsFormState,
  PointsFormSubmitCallback,
} from './EnterPointsForm.helpers';
import ExerciseBox from './ExerciseBox';
import {
  convertExercisePointInfoToString,
  getPointsOfAllExercises,
} from 'shared/dist/model/Points';
import { getPointsFromState as getAchievedPointsFromState } from '../EnterPoints.helpers';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
    },
    textBox: {
      display: 'flex',
    },
    unsavedChangesText: {
      marginLeft: theme.spacing(1),
      marginBottom: theme.spacing(1),
    },
    pointsText: {
      marginLeft: 'auto',
    },
    exerciseBox: {
      overflowY: 'auto',
      flex: 1,
    },
    buttonRow: {
      display: 'flex',
      justifyContent: 'flex-end',
      // This prevents a flashing scrollbar if the form spinner is shown.
      marginBottom: theme.spacing(0.5),
    },
    cancelButton: {
      marginRight: theme.spacing(2),
    },
    dialogDeleteButton: {
      color: theme.palette.error.main,
    },
  })
);

interface Props extends Omit<React.ComponentProps<'form'>, 'onSubmit'> {
  team: Team;
  sheet: Sheet;
  exercise: Exercise;
  onSubmit: PointsFormSubmitCallback;
}

function EnterPointsFormFormik(props: Props): JSX.Element {
  const { team, sheet, onSubmit } = props;

  const [initialValues, setInitialValues] = useState<PointsFormState>(
    generateInitialValues({ team, sheet })
  );

  useEffect(() => {
    const values = generateInitialValues({ team, sheet });
    setInitialValues(values);
  }, [team, sheet]);

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit} enableReinitialize>
      <EnterPointsForm {...props} />
    </Formik>
  );
}

function EnterPointsForm({
  team,
  sheet,
  exercise,
  className,
  onSubmit,
  ...props
}: Props): JSX.Element {
  const classes = useStyles();
  const dialog = useDialog();

  const formikContext = useFormikContext<PointsFormState>();
  const { values, errors, handleSubmit, resetForm, isSubmitting, dirty } = formikContext;

  const achieved = getAchievedPointsFromState(values);
  const total = getPointsOfAllExercises(sheet);
  const totalPoints = convertExercisePointInfoToString(total);

  const handleReset = () => {
    dialog.show({
      title: 'Eingaben zurücksetzen?',
      content:
        'Sollen die Eingaben für dieses Team und das aktuelle Übungsblatt zurückgesetzt werden? Dies kann nicht rückgängig gemacht werden.',
      actions: [
        {
          label: 'Nicht zurücksetzen',
          onClick: () => dialog.hide(),
        },
        {
          label: 'Zurücksetzen',
          onClick: () => {
            resetForm();
            dialog.hide();
          },
          buttonProps: {
            className: classes.dialogDeleteButton,
          },
        },
      ],
    });
  };

  return (
    <>
      <Prompt
        when={dirty}
        message='Es gibt ungespeichert Änderungen. Soll die Seite wirklich verlassen werden?'
      />

      <form {...props} onSubmit={handleSubmit} className={clsx(classes.root, className)}>
        <div className={classes.textBox}>
          <Typography className={classes.unsavedChangesText}>
            {dirty && <>Es gibt ungespeicherte Änderungen.</>}
          </Typography>

          <Typography
            className={classes.pointsText}
          >{`Gesamt ${achieved} / ${totalPoints} Punkte`}</Typography>
        </div>

        <ExerciseBox
          className={classes.exerciseBox}
          name={`exercises.${exercise.id}`}
          exercise={exercise}
        />

        <div className={classes.buttonRow}>
          <Button
            variant='outlined'
            onClick={handleReset}
            className={classes.cancelButton}
            disabled={!dirty}
          >
            Zurücksetzen
          </Button>

          <SubmitButton
            color='primary'
            variant='outlined'
            isSubmitting={isSubmitting}
            disabled={!dirty}
          >
            Speichern
          </SubmitButton>
        </div>

        <FormikDebugDisplay values={values} errors={errors} />
      </form>
    </>
  );
}

export default EnterPointsFormFormik;
