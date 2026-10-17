import os from "node:os";
import fs from "node:fs";

export type Config = {
  dbUrl: string;
  currentUserName: string;
};

export const setUser = (cfg: Config) => {
  writeConfig(cfg);
};

// Create read config
export const readConfig = (): Config => {
  const path = getConfigFilePath();

  try {
    const readJsonFile = fs.readFileSync(path, "utf8");
    return validateConfig(readJsonFile);
  } catch (e) {
    console.error("Error to read json file: ", e);
    throw e;
  }
};

// Non export functions to help me above
const getConfigFilePath = (): string => {
  const path = os.homedir().concat("/.gatorconfig.json");

  return path;
};

const validateConfig = (rawConfig: any): Config => {
  const obj = JSON.parse(rawConfig);

  const newObj = {
    dbUrl: obj.db_url,
    currentUserName: obj.current_user_name,
  };

  return newObj;
};

const writeConfig = (cfg: Config) => {
  const path = getConfigFilePath();

  if (cfg.dbUrl === "") {
    cfg.dbUrl = "postgres://postgres:ziad@127.0.0.1:5432/gator?sslmode=disable";
  }

  const jsonFile = {
    db_url: cfg.dbUrl,
    current_user_name: cfg.currentUserName,
  };
  const userJson = JSON.stringify(jsonFile);

  try {
    fs.writeFileSync(path, userJson);
  } catch (e) {
    console.error("Write failed: ", e);
    throw e;
  }
};
