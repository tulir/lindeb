package lindeb

import (
	_ "github.com/go-sql-driver/mysql"
	"github.com/gorilla/mux"
	"context"
	flag "maunium.net/go/mauflag"
	"fmt"
	"os"
)

var configPath = flag.MakeFull("c", "config", "Path to the config file.", "config.yaml").String()
var wantHelp, _ = flag.MakeHelpFlag()

func main() {
	err := flag.Parse()
	if err != nil {
		fmt.Println(err)
		*wantHelp = true
	}
	if *wantHelp {
		flag.PrintHelp()
		os.Exit(1)
	}

	config, err := LoadConfig(*configPath)
	if err != nil {
		fmt.Println("Failed to load config:", err)
		os.Exit(10)
	}

	db, err := config.Database.Connect()
	if err != nil {
		fmt.Println("Database connection failed:", err)
		os.Exit(11)
	}

	search, err := config.Elastic.Connect()
	if err != nil {
		fmt.Println("Elasticsearch connection failed:", err)
		os.Exit(12)
	}

	r := mux.NewRouter()
	// TODO add listen paths
	config.API.ListenAndServe(r)
}
