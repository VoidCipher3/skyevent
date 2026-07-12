import os
import sys
import tempfile
import importlib.util


MODULES = {
    "translate": "SCRIPT_TRANSLATE",
    "converter": "SCRIPT_CONVERTER",
    "diff_state": "SCRIPT_DIFF",
    "sky_client": "SCRIPT_CLIENT",
}


def load_module(name, env_key):

    code = os.environ.get(env_key)

    if not code:
        raise RuntimeError(f"Missing {env_key}")

    path = os.path.join(
        tempfile.gettempdir(),
        name + ".py"
    )

    with open(path, "w", encoding="utf-8") as f:
        f.write(code)


    spec = importlib.util.spec_from_file_location(
        name,
        path
    )

    module = importlib.util.module_from_spec(spec)

    sys.modules[name] = module

    spec.loader.exec_module(module)


for module, env in MODULES.items():
    load_module(module, env)


load_module(
    "fetch_and_build",
    "SCRIPT_MAIN"
)


import fetch_and_build


fetch_and_build.main()
