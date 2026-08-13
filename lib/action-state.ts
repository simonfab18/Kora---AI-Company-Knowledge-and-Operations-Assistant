export type ActionState = {
  error?: string;
  message?: string;
  redirectTo?: string;
  completionId?: string;
};

export const initialActionState: ActionState = {};
