import jsonpickle
from client import *


def print_dict(d, indent=0):
    for key, value in d.iteritems():
        print '\t' * indent + str(key)
        if isinstance(value, dict):
            print_dict(value, indent + 1)
        else:
            print '\t' * (indent + 1) + str(value)


def load_session_state(session_file):
    with open(session_file, 'r') as infile:
        state = jsonpickle.decode(infile.read())
        for i in dir(state):
            if not i.startswith('__'):
                obj = getattr(state, i)
                pickle_obj = unpickle(obj)
                if pickle_obj != obj:
                    setattr(state, i, pickle_obj)
        return state


def save_session_state(session_state, session_file):
    for i in dir(session_state):
        if not i.startswith('__'):
            obj = getattr(session_state, i)
            pickle_obj = pickle(obj)
            if pickle_obj != obj:
                setattr(session_state, i, pickle_obj)

    with open(session_file, 'w') as outfile:
        outfile.write(jsonpickle.encode(session_state))


def pickle(to_pickle):
    if type(to_pickle) is GPJob:
        return {'pickle_type': 'GPJob', 'uri': to_pickle['uri'], 'json': to_pickle['json']}
    elif type(to_pickle) is GPTask:
        return {'pickle_type': 'GPTask',
                'json': to_pickle['json'],
                'server': to_pickle['server_data']['url'],
                'username': to_pickle['server_data']['username'],
                'password': to_pickle['server_data']['password']}
    else:
        return to_pickle


def unpickle(from_pickle):
    if 'pickle_type' in from_pickle:
        if type(from_pickle) is GPJob:
            job = GPJob(from_pickle['uri'])
            job.json = from_pickle['json']
            return job
        elif type(from_pickle) is GPTask:
            server_data = ServerData(from_pickle['url'], from_pickle['username'], from_pickle['password'])
            json_obj = json.loads(from_pickle['json'])
            name_or_lsid = json_obj['lsid']
            task = GPTask(name_or_lsid, server_data)
            task.json = from_pickle['json']
            return task
        else:
            return from_pickle
    else:
        return from_pickle

