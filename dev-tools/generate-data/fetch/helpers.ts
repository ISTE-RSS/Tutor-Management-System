import { AxiosInstance } from 'axios';
import { IAttendance, IAttendanceDTO } from 'shared/model/Attendance';
import { IGradingDTO } from 'shared/model/Gradings';
import { ISheet, ISheetDTO } from 'shared/model/Sheet';
import { IShortTest, IShortTestDTO } from '../../../server/src/shared/model/ShortTest';
import { ICreateUserDTO, IUser } from '../../../server/src/shared/model/User';

export async function createSheet(sheetInfo: ISheetDTO, axios: AxiosInstance): Promise<ISheet> {
  const response = await axios.post<ISheet>('sheet', sheetInfo);

  if (response.status === 201) {
    return response.data;
  }

  return Promise.reject(`Wrong status code (${response.status}).`);
}

export async function createShortTest(
  dto: IShortTestDTO,
  axios: AxiosInstance
): Promise<IShortTest> {
  const response = await axios.post<IShortTest>('short-test', dto);

  if (response.status === 201) {
    return response.data;
  }

  return Promise.reject(`Wrong status code (${response.status}).`);
}

export async function createUser(dto: ICreateUserDTO, axios: AxiosInstance): Promise<IUser> {
  const response = await axios.post<IUser>('user', dto);

  if (response.status === 201) {
    return response.data;
  }

  return Promise.reject(`Wrong status code (${response.status}).`);
}

export async function setAttendanceOfStudent(
  studentId: string,
  attendanceInfo: IAttendanceDTO,
  axios: AxiosInstance
): Promise<IAttendance> {
  const response = await axios.put<IAttendance>(`student/${studentId}/attendance`, attendanceInfo);

  if (response.status === 200) {
    return response.data;
  }

  return Promise.reject(`Wrong status code (${response.status}).`);
}

export async function setPointsOfStudent(
  studentId: string,
  points: IGradingDTO,
  axios: AxiosInstance
): Promise<void> {
  const response = await axios.put(`student/${studentId}/grading`, points);

  if (response.status !== 204) {
    return Promise.reject(`Wrong status code (${response.status}).`);
  }
}
