// mauflag - An extendable command-line argument parser for Golang
// Copyright (C) 2016 Maunium
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

package main

import (
	"fmt"
	flag "maunium.net/go/mauflag"
)

var bf = flag.Make().LongKey("bff").ShortKey("b").Usage("Change the variable 'bf'").Bool()
var xb = flag.Make().ShortKey("x").Usage("Set the boolean X").UsageCategory("XYZ").Bool()
var yb = flag.Make().ShortKey("y").Usage("Set the boolean Y").UsageCategory("XYZ").Bool()
var zb = flag.Make().ShortKey("z").Usage("Set the boolean Z").UsageCategory("XYZ").Bool()
var str = flag.Make().LongKey("this-is-a-string").ShortKey("s").ShortKey("i").Usage("Set a string value").String()
var array = flag.Make().LongKey("array").ShortKey("a").LongKey("arr").Usage("Add values to an array").StringArray()
var def = flag.Make().LongKey("asd").Default("lorem").Usage("Change a variable").String()

func main() {
	flag.MakeHelpFlag()
	flag.SetHelpTitles("flagtest - Test the mauflag package", "mauflag [-b] [-x] [-y] [-z] [-s STRING] [-a ARRAY VALUE] [--asd STRING]")
	fmt.Println(flag.Parse())

	if flag.CheckHelpFlag() {
		return
	}

	fmt.Println(*bf, *xb, *yb, *zb)
	fmt.Println(*str)
	fmt.Println(*def)
	for _, arg := range *array {
		fmt.Print(arg, ", ")
	}
	fmt.Print("\n")
	for _, arg := range flag.Args() {
		fmt.Print(arg, ", ")
	}
	fmt.Print("\n")
}
