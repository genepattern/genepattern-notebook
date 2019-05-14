"""
Tests for importing the kernel-side widgets
"""
import pytest
import genepattern


def test_magics_exist():
    magics_def = genepattern.GenePatternMagic()
    assert magics_def is not None
