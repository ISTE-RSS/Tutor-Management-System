import { RouteType, RoutingPath } from './Routing.routes';

interface PointsOverviewParams {
  tutorialId: string;
  sheetId?: string;
}

interface EnterPointsForTeamParams {
  tutorialId: string;
  sheetId: string;
  teamId: string;
}

interface EnterPointsForStudentParams {
  tutorialId: string;
  sheetId: string;
  teamId: string;
  studentId: string;
}

export function getTutorialRelatedPath(route: RouteType, tutorialId: string): string {
  if (!route.isTutorialRelated) {
    return route.path;
  }

  return getPathOfRouteWithTutorial(route.path, tutorialId);
}

export function getPathOfRouteWithTutorial(routingPath: RoutingPath, tutorialId: string): string {
  return `/tutorial/${tutorialId}/${routingPath}`.replace(/\/\/+/, '/');
}

export function getPointOverviewPath({ tutorialId, sheetId }: PointsOverviewParams): string {
  const path = getPathOfRouteWithTutorial(RoutingPath.ENTER_POINTS_OVERVIEW, tutorialId);

  if (!!sheetId) {
    return path.replace(':sheetId?', sheetId);
  } else {
    return path.replace('/:sheetId?', '');
  }
}

export function getEnterPointsForTeamPath({
  tutorialId,
  sheetId,
  teamId,
}: EnterPointsForTeamParams): string {
  const path: string = getPathOfRouteWithTutorial(RoutingPath.ENTER_POINTS_TEAM, tutorialId);

  return path
    .replace(':sheetId', sheetId)
    .replace(':teamId', teamId)
    .replace(/\/\/+/, '/');
}

export function getEnterPointsForStudentPath({
  tutorialId,
  sheetId,
  teamId,
  studentId,
}: EnterPointsForStudentParams): string {
  const path: string = getPathOfRouteWithTutorial(RoutingPath.ENTER_POINTS_STUDENT, tutorialId);

  return path
    .replace(':sheetId', sheetId)
    .replace(':teamId', teamId)
    .replace(':studentId', studentId)
    .replace(/\/\/+/, '/');
}
