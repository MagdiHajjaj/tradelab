"""Build and verify C++, Go, and Python together: python scripts/check_backend.py.

Uses installed tools first, with support for this workspace's portable Windows
toolchains under .tools/. It does not install toolchains; CMake may fetch Google Test.
"""

import os
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
WINDOWS = os.name == "nt"
SUFFIX = ".exe" if WINDOWS else ""


def locate(name: str, fallback: Path) -> str:
    installed = shutil.which(name)
    if installed:
        return installed
    if fallback.is_file():
        return str(fallback)
    raise RuntimeError(f"{name} is missing. Install it and add it to PATH; see README.md.")


def main() -> None:
    env = os.environ.copy()
    # The optional MSYS2 compiler also supplies the DLLs needed by engine_server.exe.
    mingw = Path("C:/msys64/ucrt64/bin")
    if WINDOWS and mingw.is_dir():
        env["PATH"] = str(mingw) + os.pathsep + env["PATH"]
    cmake = locate("cmake", ROOT / ".tools/python/cmake/data/bin" / f"cmake{SUFFIX}")
    ctest = str(Path(cmake).with_name(f"ctest{SUFFIX}"))
    go = locate("go", ROOT / ".tools/go/bin" / f"go{SUFFIX}")
    build = ROOT / "build/engine"

    def run(args: list[str], cwd: Path = ROOT) -> None:
        print("\n> " + " ".join(map(str, args)), flush=True)
        subprocess.run(args, cwd=cwd, env=env, check=True)

    configure = [cmake, "-S", "services/matching-engine", "-B", str(build), "-DCMAKE_BUILD_TYPE=Debug"]
    if WINDOWS and mingw.is_dir():
        configure += ["-G", "MinGW Makefiles"]
    run(configure)
    run([cmake, "--build", str(build), "--config", "Debug", "--parallel", "2"])
    run([ctest, "--test-dir", str(build), "-C", "Debug", "--output-on-failure"])
    engine = build / f"engine_server{SUFFIX}"
    if not engine.exists():
        engine = build / "Debug" / f"engine_server{SUFFIX}"
    env["ENGINE_TEST_PATH"] = str(engine)
    gateway = ROOT / "build" / f"gateway{SUFFIX}"
    env["GATEWAY_TEST_PATH"] = str(gateway)
    # Race detection needs CGO and a compiler. CI enables it explicitly on Linux.
    run([go, "test", "-count=1", "./..."], ROOT / "services/gateway")
    run([go, "vet", "./..."], ROOT / "services/gateway")
    run([go, "build", "-o", str(gateway), "./cmd/gateway"], ROOT / "services/gateway")
    run([sys.executable, "-m", "unittest", "discover", "-s", "tests", "-v"], ROOT / "strategies")
    env["PYTHONPATH"] = str(ROOT / "strategies") + os.pathsep + env.get("PYTHONPATH", "")
    run([sys.executable, "-m", "unittest", "discover", "-s", "tests/integration", "-v"])
    print("\nBackend checks passed: C++ matching, Go routing, and Python-to-exchange execution.")


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, subprocess.CalledProcessError) as error:
        print(f"\nBackend verification failed: {error}", file=sys.stderr)
        sys.exit(1)
