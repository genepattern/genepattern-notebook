import jsonpickle

'''
    Used in the CEGS Workflow and kept for reference
    @deprecated
'''


def print_dict(d, indent=0):
    for key, value in d.iteritems():
        print '\t' * indent + str(key)
        if isinstance(value, dict):
            print_dict(value, indent+1)
        else:
            print '\t' * (indent+1) + str(value)


def load_session_state(session_file):
    with open(session_file, 'r') as infile:
        return jsonpickle.decode(infile.read())


def save_session_state(session_state, session_file):
    with open(session_file, 'w') as outfile:
        outfile.write(jsonpickle.encode(session_state))

