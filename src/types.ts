export type WithId<T> = {
    id: string,
} & T;

export enum ProjectAccessLevel {
    None,
    Read,
    Write,
}

// database document types only include the minimum necessary keys

export type Perms = 0 | 1 | 2;
export interface User {
    perms: Perms;
    schoolId: string;
}

export enum ProjectType {
    Template,
    Submission,
    Private,
}

export enum ProjectStatus {
    Unsubmitted,
    Submitted,
    HasFeedback,
}

export interface Project {
    classroomId: string;
    parentTask: string;
    createdBy: string;
    type: ProjectType;
    status: ProjectStatus;
}
