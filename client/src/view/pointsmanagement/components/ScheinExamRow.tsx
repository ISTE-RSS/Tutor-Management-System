import { TableCell, Typography } from '@material-ui/core';
import React from 'react';
import { ScheinExam } from 'shared/dist/model/Scheinexam';
import EntityListItemMenu from '../../../components/list-item-menu/EntityListItemMenu';
import PaperTableRow, { PaperTableRowProps } from '../../../components/PaperTableRow';
import { getDisplayStringOfScheinExam } from '../../../util/helperFunctions';
import { getPointsOfEntityAsString } from '../../points-sheet/util/helper';

interface Props extends PaperTableRowProps {
  exam: ScheinExam;
  onEditExamClicked: (exam: ScheinExam) => void;
  onDeleteExamClicked: (exam: ScheinExam) => void;
}

function ScheinExamRow({
  exam,
  onEditExamClicked,
  onDeleteExamClicked,
  ...other
}: Props): JSX.Element {
  return (
    <PaperTableRow
      label={getDisplayStringOfScheinExam(exam)}
      buttonCellContent={
        <EntityListItemMenu
          onEditClicked={() => onEditExamClicked(exam)}
          onDeleteClicked={() => onDeleteExamClicked(exam)}
        />
      }
      {...other}
    >
      <TableCell>
        <Typography variant='body2'>Anzahl Aufgaben: {exam.exercises.length}</Typography>
        <Typography variant='body2'>Gesamtpunktzahl: {getPointsOfEntityAsString(exam)}</Typography>
      </TableCell>
    </PaperTableRow>
  );
}

export default ScheinExamRow;
