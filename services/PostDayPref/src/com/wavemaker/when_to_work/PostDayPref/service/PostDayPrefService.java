package com.wavemaker.when_to_work.PostDayPref.service;


import com.wavemaker.when_to_work.PostDayPref.model.*;
import com.wavemaker.when_to_work.PostDayPref.model.RootRequest;
import com.wavemaker.when_to_work.PostDayPref.model.RootResponse;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.lang.Object;
import org.springframework.util.MultiValueMap;
import feign.*;

public interface PostDayPrefService {

  /**
   * 
   * 
    * @param body RequestBody (optional)
   * @return RootResponse
   */
  @RequestLine("POST /preferences/day/repeat")
  @Headers({
    "Content-Type: application/json",
    "Accept: */*",  })
  RootResponse invoke(RootRequest body);

}
