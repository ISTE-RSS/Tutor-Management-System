import { Typography } from '@material-ui/core';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Student } from 'shared/dist/model/Student';
import { getNameOfEntity } from 'shared/dist/util/helpers';
import { getStudent, setPointsOfStudent } from '../../../hooks/fetching/Student';
import { useErrorSnackbar } from '../../../hooks/useErrorSnackbar';
import { PointsFormSubmitCallback } from './components/EnterPointsForm.helpers';
import EnterPoints from './EnterPoints';
import { PointMap, UpdatePointsDTO } from 'shared/dist/model/Points';
import { convertFormStateToPointMap } from './EnterPoints.helpers';
import { Team } from 'shared/dist/model/Team';
import { getTeamOfTutorial } from '../../../hooks/fetching/Team';

interface RouteParams {
  tutorialId?: string;
  sheetId?: string;
  teamId?: string;
  studentId?: string;
}

function EnterStudentPoints(): JSX.Element {
  const { tutorialId, sheetId, teamId, studentId } = useParams<RouteParams>();
  const { enqueueSnackbar } = useSnackbar();
  const { setError } = useErrorSnackbar();

  const [student, setStudent] = useState<Student>();
  const [team, setTeam] = useState<Team>();

  useEffect(() => {
    if (!studentId) {
      return;
    }

    getStudent(studentId)
      .then(response => {
        setStudent(response);
      })
      .catch(() => setError('Studierende/r konnte nicht abgerufen werden.'));
  }, [studentId, setError]);

  useEffect(() => {
    if (!tutorialId || !teamId) {
      return;
    }

    getTeamOfTutorial(tutorialId, teamId)
      .then(response => {
        setTimeout(() => setTeam(response), 10000);
      })
      .catch(() => setError('Team konnte nicht abgerufen werden.'));
  });

  if (!tutorialId || !sheetId || !studentId || !teamId) {
    return (
      <Typography color='error'>
        At least one of the three required params <code>tutorialId, sheetId, studentId</code> was
        not provided through path params.
      </Typography>
    );
  }

  const handleSubmit: PointsFormSubmitCallback = async (values, { resetForm }) => {
    if (!sheetId || !tutorialId || !studentId || !student) {
      return;
    }

    const points: PointMap = convertFormStateToPointMap({
      values,
      sheetId: sheetId,
    });
    const updateDTO: UpdatePointsDTO = {
      points: points.toDTO(),
    };

    try {
      await setPointsOfStudent(studentId, updateDTO);
      const updatedStudent = await getStudent(studentId);

      setStudent(updatedStudent);

      resetForm({ values: { ...values } });
      enqueueSnackbar(`Punkte für ${getNameOfEntity(student)} erfolgreich eingetragen.`, {
        variant: 'success',
      });
    } catch {
      enqueueSnackbar(`Punkte für ${getNameOfEntity(student)} konnten nicht eingetragen werden.`, {
        variant: 'error',
      });
    }
  };

  const allStudents: Student[] = team ? team.students : student ? [student] : [];

  return (
    <EnterPoints
      tutorialId={tutorialId}
      sheetId={sheetId}
      entity={student}
      onSubmit={handleSubmit}
      allEntities={allStudents}
      entitySelectProps={{
        label: 'Student',
        emptyPlaceholder: 'Keine Studierenden verfügbar.',
        itemToString: s => getNameOfEntity(s),
      }}
    />
  );
}

export default EnterStudentPoints;
