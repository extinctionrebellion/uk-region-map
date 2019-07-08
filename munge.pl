#!/usr/bin/perl
#
foreach( <>) {
	chomp;
	my $id=lc $_;
	my $name = $_;
	$id=~s/[^a-z ]//g;
	$id=~s/ /-/g;
	print <<END;
  <div class='area-info-section' id='$id'>
     <div class='area-title'>$name</div>
     <p>
     </p>
  </div>
END
}

