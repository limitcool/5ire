import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogTrigger,
  DialogBody,
  Button,
  Field,
  Input,
  DialogActions,
  InputOnChangeData,
} from '@fluentui/react-components';
import { useTranslation } from 'react-i18next';
import {
  AddCircleRegular,
  Dismiss24Regular,
  SubtractCircleRegular,
} from '@fluentui/react-icons';
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';

import 'highlight.js/styles/atom-one-light.css';
import { IMCPServer } from 'types/mcp';
import useMarkdown from 'hooks/useMarkdown';
import { isValidMCPServerKey } from 'utils/validators';
import useMCPStore from 'stores/useMCPStore';
import useToast from 'hooks/useToast';

export default function ToolEditDialog(options: {
  server: IMCPServer | null;
  open: boolean;
  setOpen: Function;
}) {
  const { t } = useTranslation();
  const { render } = useMarkdown();
  const { notifySuccess, notifyError } = useToast();
  const { server, open, setOpen } = options;
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [command, setCommand] = useState('');
  const [envName, setEnvName] = useState('');
  const [envValue, setEnvValue] = useState('');
  const [env, setEnv] = useState<{ [key: string]: string }>({});
  const { addServer, updateServer } = useMCPStore();

  const [keyValidationState, setKeyValidationState] = useState<
    'none' | 'error'
  >('none');
  const [commandValidationState, setCommandValidationState] = useState<
    'none' | 'error'
  >('none');

  const cmd = useMemo(() => {
    const arr = command.split(/\s+/).filter((i: string) => i.trim() !== '');
    if (arr.length > 0) {
      return arr[0];
    }
    return '';
  }, [command]);

  const args = useMemo(() => {
    const arr = command.split(/\s+/).filter((i: string) => i.trim() !== '');
    if (arr.length > 1) {
      return arr.slice(1);
    }
    return [];
  }, [command]);

  const config: IMCPServer = useMemo(() => {
    const payload: any = {};
    if (name.trim() !== '') {
      payload.name = name;
    }
    if (key.trim() !== '') {
      payload.key = key;
    }
    if (description.trim() !== '') {
      payload.description = description;
    }
    if (cmd) {
      payload.command = cmd;
    }
    if (args.length > 0) {
      payload.args = args;
    }
    if (Object.keys(env).length > 0) {
      payload.env = env;
    }
    if (envName.trim() !== '' && envValue.trim() !== '') {
      payload.env = { ...env, [envName.trim()]: envValue.trim() };
    }
    return payload;
  }, [name, key, description, cmd, args, env, envName, envValue]);

  const addEnv = useCallback(() => {
    if (envName.trim() === '' || envValue.trim() === '') {
      return;
    }
    setEnv((_env) => ({ ..._env, [envName.trim()]: envValue.trim() }));
    setEnvName('');
    setEnvValue('');
  }, [envName, envValue]);

  const submit = useCallback(async () => {
    let isValid = true;
    if (!isValidMCPServerKey(key)) {
      setKeyValidationState('error');
      isValid = false;
    } else {
      setKeyValidationState('none');
    }
    if (!cmd) {
      setCommandValidationState('error');
      isValid = false;
    } else {
      setCommandValidationState('none');
    }
    if (!isValid) {
      return;
    }
    const upset = server ? updateServer : addServer;
    const ok = await upset(config);
    if (ok) {
      setOpen(false);
      notifySuccess('Server saved successfully');
    } else {
      notifyError(server ? 'Cannot update server' : 'Server already exists');
    }
  }, [name, key, description, cmd, args, env, envName, envValue, server]);

  useEffect(() => {
    if (open && server) {
      setName(server.name || '');
      setKey(server.key);
      setDescription(server.description || '');
      setCommand([server.command, ...(server.args || [])].join(' '));
      setEnv(server.env || {});
    }

    return () => {
      setName('');
      setKey('');
      setDescription('');
      setCommand('');
      setEnvName('');
      setEnvValue('');
      setEnv({});
    };
  }, [open, server]);

  return (
    <div>
      <Dialog open={open}>
        <DialogSurface mountNode={document.body.querySelector('#portal')}>
          <DialogBody>
            <DialogTitle
              action={
                <DialogTrigger action="close">
                  <Button
                    onClick={() => setOpen(false)}
                    appearance="subtle"
                    aria-label="close"
                    icon={<Dismiss24Regular />}
                  />
                </DialogTrigger>
              }
            >
              {server ? t('Tools.Edit') : t('Tools.New')}
            </DialogTitle>
            <DialogContent className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Field
                    label={t('Tools.Key')}
                    validationState={keyValidationState}
                    validationMessage={
                      server ? t('Tools.KeyCannotUpdate') : t('Tools.KeyHint')
                    }
                  >
                    <Input
                      disabled={!!server}
                      className="w-full min-w-fit"
                      placeholder={t('Common.Required')}
                      value={key}
                      onChange={(
                        _: ChangeEvent<HTMLInputElement>,
                        data: InputOnChangeData,
                      ) => {
                        setKey(data.value);
                        if (!data.value || isValidMCPServerKey(data.value)) {
                          setKeyValidationState('none');
                        } else {
                          setKeyValidationState('error');
                        }
                      }}
                    />
                  </Field>
                </div>
                <div>
                  <Field label={t('Tools.Name')}>
                    <Input
                      className="w-full min-w-fit"
                      placeholder={t('Common.Optional')}
                      value={name}
                      onChange={(
                        _: ChangeEvent<HTMLInputElement>,
                        data: InputOnChangeData,
                      ) => {
                        setName(data.value);
                      }}
                    />
                  </Field>
                </div>
              </div>
              <div>
                <Field label={t('Common.Description')}>
                  <Input
                    className="w-full min-w-fit"
                    placeholder={t('Common.Optional')}
                    value={description}
                    onChange={(
                      _: ChangeEvent<HTMLInputElement>,
                      data: InputOnChangeData,
                    ) => {
                      setDescription(data.value);
                    }}
                  />
                </Field>
              </div>
              <div>
                <Field
                  label={t('Tools.Command')}
                  validationMessage={`${t('Tools.Hint.CommandIsRequired')}, like: npx -y @mcp-server"`}
                  validationState={commandValidationState}
                >
                  <Input
                    className="w-full min-w-fit"
                    placeholder={t('Common.Required')}
                    value={command}
                    onInput={(event: ChangeEvent<HTMLInputElement>) => {
                      const val = event.target.value;
                      setCommand(val);
                      if (val.trim() === '') {
                        setCommandValidationState('error');
                      } else {
                        setCommandValidationState('none');
                      }
                    }}
                  />
                </Field>
              </div>
              <div>
                <Field label={t('Tools.EnvVars')}>
                  <div className="bg-gray-50 dark:bg-neutral-800 border rounded border-base">
                    <div className="flex flex-start items-center border-b border-base px-1 py-1">
                      <div className="w-5/12">{t('Common.EnvName')}</div>
                      <div className="w-6/12">{t('Common.EnvValue')}</div>
                      <div />
                    </div>
                    <div className="flex flex-start items-center border-b border-base px-1 p-1">
                      <div className="w-5/12 px-1">
                        <Input
                          className="w-full"
                          size="small"
                          value={envName || ''}
                          onChange={(
                            _: ChangeEvent<HTMLInputElement>,
                            data: InputOnChangeData,
                          ) => {
                            setEnvName(data.value);
                          }}
                        />
                      </div>
                      <div className="w-6/12 px-1">
                        <Input
                          className="w-full"
                          size="small"
                          value={envValue || ''}
                          onChange={(
                            _: ChangeEvent<HTMLInputElement>,
                            data: InputOnChangeData,
                          ) => {
                            setEnvValue(data.value);
                          }}
                        />
                      </div>
                      <div>
                        <Button
                          appearance="subtle"
                          onClick={addEnv}
                          icon={<AddCircleRegular />}
                          size="small"
                        />
                      </div>
                    </div>
                    <div className="overflow-y-auto min-h-6 max-h-40 flex flex-col">
                      {Object.keys(env).map((key: string) => (
                        <div
                          key={key}
                          className="flex flex-start items-center [&:not(:last-child)]:border-b w-full px-1"
                        >
                          <div className="w-5/12 px-2 text-xs overflow-hidden text-nowrap truncate">
                            {key}
                          </div>
                          <div className="w-6/12 px-2 text-xs overflow-hidden text-nowrap truncate">
                            {env[key]}
                          </div>
                          <div>
                            <Button
                              appearance="subtle"
                              icon={<SubtractCircleRegular />}
                              size="small"
                              onClick={() => {
                                const newEnv = { ...env };
                                delete newEnv[key];
                                setEnv(newEnv);
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Field>
              </div>
              <div>
                <Field label={t('Tools.ConfigPreview')} hint="in JSON format">
                  <div
                    className="border rounded border-base text-xs"
                    dangerouslySetInnerHTML={{
                      __html: render(
                        `\`\`\`json\n${JSON.stringify(config, null, 2)}\n\`\`\``,
                      ),
                    }}
                  />
                </Field>
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="subtle" onClick={() => setOpen(false)}>
                {t('Common.Cancel')}
              </Button>
              <Button type="submit" appearance="primary" onClick={submit}>
                {t('Common.Save')}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
