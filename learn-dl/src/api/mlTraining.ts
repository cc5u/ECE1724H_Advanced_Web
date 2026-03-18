import mlClient from "./mlClient";
import api from "./axiosClient";
import { getCurrentUserId } from "./session";

type TrainingRequestParams = {
  userId: string;
  trainingSessionId: string;
};

export type TrainingPayload = {
  training_config: {
    learning_rate: number | string;
    n_epochs: number;
    batch_size: number;
    eval_step: number;
  };
  data_config: {
    data_path: string;
    lowercase: boolean;
    remove_punctuation: boolean;
    remove_stopwords: boolean;
    lemmatization: boolean;
    handle_urls: string;
    handle_emails: string;
    train_ratio: number;
    test_ratio: number;
    stratify: boolean;
    class_map: Record<any, any>| null;
  };
  embed_model_config: {
    embed_model: string;
    fine_tune_mode: string;
    unfreeze_last_n_layers: number | null;
  };
  classifier_config: {
    model_name: string;
    hidden_neurons: number;
    dropout: number;
    num_classes: number;
    classifier_type: string;
  };
};

export type PredictionConfig = {
  classifier_config: {
    model_name: string;
    hidden_neurons: number;
    dropout: number;
    num_classes: number;
    classifier_type: string;
  };
  embed_model_config: {
    embed_model: string;
    fine_tune_mode: string;
    unfreeze_last_n_layers: number | null;
  };
  training_config: {
    learning_rate: number | string;
    n_epochs: number;
    batch_size: number;
    eval_step: number;
  };
};

const buildTrainingParams = ({ userId, trainingSessionId }: TrainingRequestParams) => ({
  user_id: userId,
  training_session_id: trainingSessionId,
});

export const startTrainingRun = (
  params: TrainingRequestParams,
  payload: TrainingPayload,
) =>
  mlClient.post("/train", payload, {
    params: buildTrainingParams(params),
  });

export const getTrainingStatus = (params: TrainingRequestParams) =>
  mlClient.get("/get_train_status", {
    params: buildTrainingParams(params),
  });

export const cancelTrainingRun = (params: TrainingRequestParams) =>
  mlClient.post("/cancel_train", null, {
    params: buildTrainingParams(params),
  });

export const predictWithTrainingSession = (
  params: TrainingRequestParams,
  userInput: string,
  config: PredictionConfig,
) =>
  mlClient.post(
    "/model_output",
    {
      user_input: userInput,
      config,
    },
    {
      params: buildTrainingParams(params),
    },
  );

// get all csv files for the user_id
export const readUserDataset = async () => {
  const userId = await getCurrentUserId();
  const response = await api.get(`/users/${userId}/datasets`);
  return response.data?.datasets ?? [];
};
